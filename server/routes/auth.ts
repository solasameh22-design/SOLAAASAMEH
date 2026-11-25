import { Router } from 'express';
import { query } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { checkPassword, hashPassword } from '../lib/password.js';
import { COOKIE_NAME, cookieOptions, signToken } from '../lib/token.js';
import { requireAuth } from '../middleware/auth.js';
import { loginSchema, signupSchema } from '../schemas/auth.js';
import type { Role } from '../lib/roles.js';

export const authRouter = Router();

// The only columns we ever send back. password_hash is not in this list on purpose.
const PUBLIC_USER = 'id, full_name, email, role, created_at';

type UserRow = { id: string; full_name: string; email: string; role: Role; created_at: string };

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  const data = signupSchema.parse(req.body);
  const hash = await hashPassword(data.password);
  try {
    const { rows } = await query<UserRow>(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING ${PUBLIC_USER}`,
      [data.full_name, data.email, hash, data.role],
    );
    const user = rows[0];
    res.cookie(COOKIE_NAME, await signToken({ id: user.id, role: user.role }), cookieOptions);
    res.status(201).json({ user });
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === '23505') {
      throw new HttpError(409, 'An account with this email already exists.', { email: 'This email is already registered.' });
    }
    throw err;
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const data = loginSchema.parse(req.body);
  const { rows } = await query<UserRow & { password_hash: string | null }>(
    `SELECT ${PUBLIC_USER}, password_hash FROM users WHERE lower(email) = $1`,
    [data.email],
  );
  const found = rows[0];
  const ok = await checkPassword(data.password, found?.password_hash ?? null);
  // Same message for "no such email" and "wrong password", so nobody can find out which emails exist.
  if (!found || !ok) throw new HttpError(401, 'Email or password is not correct.');

  const { password_hash: _drop, ...user } = found;
  res.cookie(COOKIE_NAME, await signToken({ id: user.id, role: user.role }), cookieOptions);
  res.json({ user });
});

// POST /api/auth/logout
authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.json({ ok: true });
});

// GET /api/auth/me  (who am I? the front end calls this when the page loads)
authRouter.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query<UserRow>(`SELECT ${PUBLIC_USER} FROM users WHERE id = $1`, [req.user!.id]);
  if (!rows[0]) throw new HttpError(401, 'Your account no longer exists. Please register again.');
  res.json({ user: rows[0] });
});
