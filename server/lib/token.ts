import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config.js';
import { ROLES, type Role } from './roles.js';

export const COOKIE_NAME = 'token';
const key = new TextEncoder().encode(config.jwtSecret);

// HttpOnly: JavaScript in the browser cannot read it. Lax: it is not sent on other sites' forms.
export const cookieOptions = {
  httpOnly: true,
  secure: config.isProd, // HTTPS only on Vercel, plain HTTP allowed on localhost
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export type AuthUser = { id: string; role: Role };

export function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyToken(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
  const role = payload.role as Role;
  if (typeof payload.sub !== 'string' || !ROLES.includes(role)) throw new Error('Bad token');
  return { id: payload.sub, role };
}
