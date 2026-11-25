import { z } from 'zod';
import { uuid } from './places.js';

const isRealDate = (s: string) => {
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD.')
  .refine(isRealDate, 'That date does not exist.');

// Full date and time WITH a time zone, for example 2026-12-02T15:00:00Z or 2026-12-02T17:00:00+02:00.
// In the browser: new Date(inputValue).toISOString()
const dateTime = z.string().datetime({ offset: true, message: 'Use a full date and time, like 2026-12-02T15:00:00Z.' });

const notes = z.union([
  z.string().trim().max(500, 'Use at most 500 characters.').transform((v) => (v === '' ? null : v)),
  z.null(),
]);

const tripFields = {
  title: z.string().trim().min(1, 'Give your trip a title.').max(120, 'Use at most 120 characters.'),
  location_id: uuid,
  start_date: dateOnly,
  end_date: dateOnly,
  budget: z.number().min(0, 'Budget cannot be negative.').max(10_000_000, 'That budget is too large.').nullable(),
  interests: notes,
};

const datesInOrder = (d: { start_date?: string; end_date?: string }) => !d.start_date || !d.end_date || d.end_date >= d.start_date;
const datesMessage = { message: 'End date must be on or after the start date.', path: ['end_date'] };

export const createTripSchema = z
  .object({
    ...tripFields,
    budget: tripFields.budget.optional(),
    interests: tripFields.interests.optional(),
    is_shared: z.boolean().optional(),
  })
  .strict()
  .refine(datesInOrder, datesMessage);

// Sharing is changed only through the share route, so is_shared is not editable here.
export const updateTripSchema = z
  .object(tripFields)
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, 'Send at least one field to change.')
  .refine(datesInOrder, datesMessage);

export const addItemSchema = z.object({ place_id: uuid, planned_at: dateTime, notes: notes.optional() }).strict();

export const updateItemSchema = z
  .object({ planned_at: dateTime, notes })
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, 'Send at least one field to change.');

// Every item of the trip, once each, in the order you want.
export const reorderSchema = z
  .object({
    item_ids: z
      .array(uuid)
      .min(1, 'Send the ids of every stop in the trip.')
      .max(200, 'Too many stops.')
      .refine((ids) => new Set(ids).size === ids.length, 'Each stop id must appear only once.'),
  })
  .strict();

export const shareSchema = z.object({ is_active: z.boolean() }).strict();

export const shareToken = z.string().regex(/^[a-f0-9]{32}$/, 'That share link is not valid.');
