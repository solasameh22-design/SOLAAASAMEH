import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/errors.js';
import type { Role } from '../lib/roles.js';
import { COOKIE_NAME, verifyToken, type AuthUser } from '../lib/token.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Use on any route that needs a logged-in user. Puts { id, role } on req.user.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new HttpError(401, 'Please log in first.');
  try {
    req.user = await verifyToken(token);
  } catch {
    throw new HttpError(401, 'Your session has expired. Please log in again.');
  }
  next();
}

// Use after requireAuth: requireRole('tour_guide') lets only tour guides through.
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, 'Please log in first.');
    if (!allowed.includes(req.user.role)) {
      throw new HttpError(403, `This action is only for these roles: ${allowed.join(', ')}.`);
    }
    next();
  };
}
