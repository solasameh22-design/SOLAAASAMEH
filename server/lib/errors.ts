import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

// Every error the API sends looks like: { "error": "message", "fields": { "email": "message" } }
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

function fromZod(err: ZodError): HttpError {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.');
    if (key && !(key in fields)) fields[key] = issue.message;
  }
  if (Object.keys(fields).length === 0) {
    return new HttpError(400, err.issues[0]?.message ?? 'The request is not valid.');
  }
  return new HttpError(400, 'Please fix the highlighted fields.', fields);
}

// Turns PostgreSQL error codes into messages a person can act on.
function fromDatabase(err: { code?: string; constraint?: string }): HttpError | null {
  switch (err.code) {
    case '23505':
      return new HttpError(409, 'That value is already in use.');
    case '23503':
      if (err.constraint === 'fk_appointments_place') return new HttpError(404, 'That place does not exist.');
      if (err.constraint === 'fk_trips_location' || err.constraint === 'fk_places_location') {
        return new HttpError(400, 'That destination does not exist.', { location_id: 'Choose a destination from the list.' });
      }
      return new HttpError(400, 'A linked record does not exist.');
    case '23514':
      if (err.constraint === 'chk_trips_dates') {
        return new HttpError(400, 'End date must be on or after the start date.', { end_date: 'End date must be on or after the start date.' });
      }
      if (err.constraint === 'chk_trips_budget') return new HttpError(400, 'Budget cannot be negative.', { budget: 'Budget cannot be negative.' });
      if (err.constraint === 'chk_places_category') {
        return new HttpError(400, 'Category must be attraction, restaurant, hotel or entertainment.', { category: 'Choose a valid category.' });
      }
      return new HttpError(400, 'One of the values is not allowed.');
    case '22P02':
    case '22007':
    case '22008':
      return new HttpError(400, 'A value has the wrong format.');
    default:
      return null;
  }
}

// Express calls this for every error thrown in a route (Express 5 also catches async errors).
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  let out: HttpError | null = null;
  const e = err as { type?: string; code?: string; constraint?: string };

  if (err instanceof HttpError) out = err;
  else if (err instanceof ZodError) out = fromZod(err);
  else if (e?.type === 'entity.parse.failed') out = new HttpError(400, 'The request body is not valid JSON.');
  else if (e?.type === 'entity.too.large') out = new HttpError(413, 'The request body is too large.');
  else out = fromDatabase(e ?? {});

  if (!out) {
    console.error(err); // the real error stays in the server log only
    out = new HttpError(500, 'Something went wrong on our side. Please try again.');
  }
  res.status(out.status).json({ error: out.message, ...(out.fields ? { fields: out.fields } : {}) });
}
