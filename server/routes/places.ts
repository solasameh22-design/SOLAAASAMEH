import { Router } from 'express';
import { query } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { buildSet } from '../lib/update.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createPlaceSchema, listPlacesQuery, updatePlaceSchema, uuid } from '../schemas/places.js';

export const placesRouter = Router();

const COLUMNS = `p.id, p.location_id, p.name, p.category, p.address, p.description, p.local_tip,
                 p.booking_url, p.is_hidden_gem, p.guide_id, u.full_name AS guide_name`;

// GET /api/places?location_id=...&category=restaurant&hidden_gem=true   public
placesRouter.get('/', async (req, res) => {
  const f = listPlacesQuery.parse(req.query);
  const { rows } = await query(
    `SELECT ${COLUMNS}
       FROM places p LEFT JOIN users u ON u.id = p.guide_id
      WHERE ($1::uuid IS NULL OR p.location_id = $1)
        AND ($2::text IS NULL OR p.category = $2)
        AND ($3::boolean IS NULL OR p.is_hidden_gem = $3)
      ORDER BY p.name
      LIMIT $4 OFFSET $5`,
    [f.location_id ?? null, f.category ?? null, f.hidden_gem ?? null, f.limit, f.offset],
  );
  res.json({ places: rows, limit: f.limit, offset: f.offset });
});

// GET /api/places/:id    (Place Details) public
placesRouter.get('/:id', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { rows } = await query(
    `SELECT ${COLUMNS}, l.name AS location_name, l.country AS location_country
       FROM places p
       JOIN location l ON l.id = p.location_id
       LEFT JOIN users u ON u.id = p.guide_id
      WHERE p.id = $1`,
    [id],
  );
  if (!rows[0]) throw new HttpError(404, 'Place not found.');
  res.json({ place: rows[0] });
});

// POST /api/places    tour guides only. The guide is taken from the token, never from the body.
placesRouter.post('/', requireAuth, requireRole('tour_guide'), async (req, res) => {
  const d = createPlaceSchema.parse(req.body);
  const { rows } = await query(
    `INSERT INTO places (location_id, name, category, address, description, local_tip, booking_url, is_hidden_gem, guide_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING id`,
    [d.location_id, d.name, d.category, d.address ?? null, d.description ?? null, d.local_tip ?? null,
     d.booking_url ?? null, d.is_hidden_gem ?? false, req.user!.id],
  );
  const full = await query(`SELECT ${COLUMNS} FROM places p LEFT JOIN users u ON u.id = p.guide_id WHERE p.id = $1`, [rows[0].id]);
  res.status(201).json({ place: full.rows[0] });
});

// PATCH /api/places/:id    only the guide who created the place
placesRouter.patch('/:id', requireAuth, requireRole('tour_guide'), async (req, res) => {
  const id = uuid.parse(req.params.id);
  const d = updatePlaceSchema.parse(req.body);
  const { set, values } = buildSet(d, 3);
  const { rowCount } = await query(`UPDATE places SET ${set} WHERE id = $1 AND guide_id = $2`, [id, req.user!.id, ...values]);
  if (!rowCount) throw new HttpError(404, 'Place not found, or it was added by another guide.');
  const full = await query(`SELECT ${COLUMNS} FROM places p LEFT JOIN users u ON u.id = p.guide_id WHERE p.id = $1`, [id]);
  res.json({ place: full.rows[0] });
});

// DELETE /api/places/:id    only the guide who created the place
placesRouter.delete('/:id', requireAuth, requireRole('tour_guide'), async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { rowCount } = await query(`DELETE FROM places WHERE id = $1 AND guide_id = $2`, [id, req.user!.id]);
  if (!rowCount) throw new HttpError(404, 'Place not found, or it was added by another guide.');
  res.status(204).end();
});
