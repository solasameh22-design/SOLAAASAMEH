import { z } from 'zod';

export const CATEGORIES = ['attraction', 'restaurant', 'hotel', 'entertainment'] as const;

export const uuid = z.string().uuid('That id is not valid.');

// Optional text: an empty string becomes null (clears the value).
const text = (max: number) =>
  z.union([
    z.string().trim().max(max, `Use at most ${max} characters.`).transform((v) => (v === '' ? null : v)),
    z.null(),
  ]);

const link = z
  .string()
  .trim()
  .max(500, 'Use at most 500 characters.')
  .url('Enter a full web address.')
  .refine((v) => /^https?:\/\//i.test(v), 'The link must start with http:// or https://');
const optionalLink = z.union([z.literal('').transform(() => null), link, z.null()]);

const placeFields = {
  name: z.string().trim().min(2, 'Enter a name.').max(120, 'Use at most 120 characters.'),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choose attraction, restaurant, hotel or entertainment.' }) }),
  address: text(200).optional(),
  description: text(2000).optional(),
  local_tip: text(500).optional(),
  booking_url: optionalLink.optional(),
  is_hidden_gem: z.boolean().optional(),
};

export const createPlaceSchema = z.object({ location_id: uuid, ...placeFields }).strict();

export const updatePlaceSchema = z
  .object(placeFields)
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, 'Send at least one field to change.');

export const listPlacesQuery = z.object({
  location_id: uuid.optional(),
  category: z.enum(CATEGORIES).optional(),
  hidden_gem: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const listLocationsQuery = z.object({
  q: z.string().trim().max(60).optional(),
});
