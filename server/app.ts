import cookieParser from 'cookie-parser';
import express from 'express';
import { errorHandler, HttpError } from './lib/errors.js';
import { authRouter } from './routes/auth.js';
import { locationsRouter } from './routes/locations.js';
import { placesRouter } from './routes/places.js';
import { sharedRouter } from './routes/shared.js';
import { tripsRouter } from './routes/trips.js';

export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

// Tiny CSRF guard: cookies are SameSite=Lax, and we also require JSON for anything that changes data.
app.use((req, _res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.headers['content-length'] !== '0' && !req.is('application/json')) {
    throw new HttpError(415, 'Send the body as JSON with the header Content-Type: application/json.');
  }
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/destinations', locationsRouter);
app.use('/api/places', placesRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/shared', sharedRouter);

app.use('/api', () => {
  throw new HttpError(404, 'That API route does not exist.');
});
app.use(errorHandler);
