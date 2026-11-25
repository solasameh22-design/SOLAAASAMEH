import { Router } from 'express';
import { pool, query } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { buildSet } from '../lib/update.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uuid } from '../schemas/places.js';
import {
  addItemSchema, createTripSchema, reorderSchema, shareSchema, updateItemSchema, updateTripSchema,
} from '../schemas/trips.js';

export const tripsRouter = Router();
tripsRouter.use(requireAuth); // every trip route needs a logged-in user

// Every query below filters by user_id from the TOKEN. The server bypasses row level security,
// so this filter is what keeps one user out of another user's trips.
const TRIP_COLS = `t.id, t.title, t.location_id, l.name AS location_name, l.country AS location_country,
                   t.start_date::text AS start_date, t.end_date::text AS end_date,
                   t.budget::float8 AS budget, t.interests, t.status, t.is_shared, t.created_at`;

async function getOwnedTrip(tripId: string, userId: string) {
  const { rows } = await query(
    `SELECT ${TRIP_COLS} FROM trips t JOIN location l ON l.id = t.location_id WHERE t.id = $1 AND t.user_id = $2`,
    [tripId, userId],
  );
  // 404 (not 403) so nobody can learn that someone else's trip id exists.
  if (!rows[0]) throw new HttpError(404, 'Trip not found.');
  return rows[0];
}

// GET /api/trips            my trips
tripsRouter.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT ${TRIP_COLS}, (SELECT count(*)::int FROM appointments a WHERE a.trip_id = t.id) AS stop_count
       FROM trips t JOIN location l ON l.id = t.location_id
      WHERE t.user_id = $1 ORDER BY t.start_date DESC, t.created_at DESC LIMIT 100`,
    [req.user!.id],
  );
  res.json({ trips: rows });
});

// POST /api/trips           (Create Trip)  tourists and trip planners
tripsRouter.post('/', requireRole('tourist', 'trip_planner'), async (req, res) => {
  const d = createTripSchema.parse(req.body);
  const { rows } = await query<{ id: string }>(
    `INSERT INTO trips (user_id, location_id, title, start_date, end_date, budget, interests, is_shared)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [req.user!.id, d.location_id, d.title, d.start_date, d.end_date, d.budget ?? null, d.interests ?? null, d.is_shared ?? false],
  );
  res.status(201).json({ trip: await getOwnedTrip(rows[0].id, req.user!.id) });
});

// GET /api/trips/:id        (Trip Itinerary)  the trip, its stops in order, and its share link
tripsRouter.get('/:id', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const trip = await getOwnedTrip(id, req.user!.id);
  const items = await query(
    `SELECT a.id, a.place_id, a.planned_at, a.notes, a.sort_order,
            p.name AS place_name, p.category, p.address, p.is_hidden_gem
       FROM appointments a LEFT JOIN places p ON p.id = a.place_id
      WHERE a.trip_id = $1 ORDER BY a.sort_order, a.created_at`,
    [id],
  );
  const share = await query<{ share_token: string; is_active: boolean }>(
    `SELECT share_token, is_active FROM trip_shares WHERE trip_id = $1`, [id],
  );
  res.json({
    trip,
    items: items.rows,
    share: share.rows[0] ? { token: share.rows[0].share_token, is_active: share.rows[0].is_active } : null,
  });
});

// PATCH /api/trips/:id
tripsRouter.patch('/:id', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const d = updateTripSchema.parse(req.body);
  const current = await getOwnedTrip(id, req.user!.id);
  // If only one date is sent, compare it with the saved other one.
  const start = d.start_date ?? current.start_date;
  const end = d.end_date ?? current.end_date;
  if (end < start) {
    throw new HttpError(400, 'End date must be on or after the start date.', { end_date: 'End date must be on or after the start date.' });
  }
  const { set, values } = buildSet(d, 3);
  await query(`UPDATE trips SET ${set} WHERE id = $1 AND user_id = $2`, [id, req.user!.id, ...values]);
  res.json({ trip: await getOwnedTrip(id, req.user!.id) });
});

// DELETE /api/trips/:id     stops and share link are removed by ON DELETE CASCADE
tripsRouter.delete('/:id', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { rowCount } = await query(`DELETE FROM trips WHERE id = $1 AND user_id = $2`, [id, req.user!.id]);
  if (!rowCount) throw new HttpError(404, 'Trip not found.');
  res.status(204).end();
});

// POST /api/trips/:id/items     ("Add to itinerary" on Place Details)
tripsRouter.post('/:id/items', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const d = addItemSchema.parse(req.body);
  await getOwnedTrip(id, req.user!.id);
  const { rows } = await query(
    `INSERT INTO appointments (trip_id, place_id, planned_at, notes, status, sort_order)
     VALUES ($1, $2, $3, $4, 'places',
             COALESCE((SELECT max(sort_order) FROM appointments WHERE trip_id = $1), 0) + 1)
     RETURNING id, place_id, planned_at, notes, sort_order`,
    [id, d.place_id, d.planned_at, d.notes ?? null],
  );
  res.status(201).json({ item: rows[0] });
});

// PATCH /api/trips/:id/items/reorder   body: { item_ids: [...] }  (must be registered before :itemId)
tripsRouter.patch('/:id/items/reorder', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { item_ids } = reorderSchema.parse(req.body);
  await getOwnedTrip(id, req.user!.id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Lock the trip's stops so two reorders cannot mix.
    const { rows } = await client.query<{ id: string }>(`SELECT id FROM appointments WHERE trip_id = $1 FOR UPDATE`, [id]);
    const existing = new Set(rows.map((r) => r.id));
    if (existing.size !== item_ids.length || !item_ids.every((i) => existing.has(i))) {
      throw new HttpError(400, 'Send every stop of this trip exactly once.', { item_ids: 'The list must match the stops in the trip.' });
    }
    await client.query(
      `UPDATE appointments a SET sort_order = o.pos
         FROM unnest($2::uuid[]) WITH ORDINALITY AS o(id, pos)
        WHERE a.id = o.id AND a.trip_id = $1`,
      [id, item_ids],
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  res.json({ ok: true });
});

// PATCH /api/trips/:id/items/:itemId
tripsRouter.patch('/:id/items/:itemId', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const itemId = uuid.parse(req.params.itemId);
  const d = updateItemSchema.parse(req.body);
  await getOwnedTrip(id, req.user!.id);
  const { set, values } = buildSet(d, 3);
  const { rows } = await query(
    `UPDATE appointments SET ${set} WHERE id = $1 AND trip_id = $2 RETURNING id, place_id, planned_at, notes, sort_order`,
    [itemId, id, ...values],
  );
  if (!rows[0]) throw new HttpError(404, 'Stop not found in this trip.');
  res.json({ item: rows[0] });
});

// DELETE /api/trips/:id/items/:itemId
tripsRouter.delete('/:id/items/:itemId', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const itemId = uuid.parse(req.params.itemId);
  await getOwnedTrip(id, req.user!.id);
  const { rowCount } = await query(`DELETE FROM appointments WHERE id = $1 AND trip_id = $2`, [itemId, id]);
  if (!rowCount) throw new HttpError(404, 'Stop not found in this trip.');
  res.status(204).end();
});

// PUT /api/trips/:id/share     body: { is_active: true|false }   creates or switches the share link
tripsRouter.put('/:id/share', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { is_active } = shareSchema.parse(req.body);
  await getOwnedTrip(id, req.user!.id);
  const { rows } = await query<{ share_token: string; is_active: boolean }>(
    `INSERT INTO trip_shares (trip_id, is_active) VALUES ($1, $2)
     ON CONFLICT (trip_id) DO UPDATE SET is_active = EXCLUDED.is_active
     RETURNING share_token, is_active`,
    [id, is_active],
  );
  await query(`UPDATE trips SET is_shared = $3 WHERE id = $1 AND user_id = $2`, [id, req.user!.id, is_active]);
  res.json({ share: { token: rows[0].share_token, is_active: rows[0].is_active } });
});
