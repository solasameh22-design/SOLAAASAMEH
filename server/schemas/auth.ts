import { z } from 'zod';
import { ROLES } from '../lib/roles.js';

const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254, 'That email is too long.');

export const signupSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Enter your full name.').max(100, 'Use at most 100 characters.'),
    email,
    // bcrypt only reads the first 72 bytes, so longer passwords are refused instead of silently cut.
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Use at most 72 bytes (about 72 characters).'),
    role: z.enum(ROLES, { errorMap: () => ({ message: 'Choose tourist, tour_guide or trip_planner.' }) }).default('tourist'),
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1, 'Enter your password.').max(200, 'That password is too long.'),
  })
  .strict();
