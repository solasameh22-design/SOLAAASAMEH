import { Router } from 'express';
import { query } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { listLocationsQuery } from '../schemas/places.js';
import { uuid } from '../schemas/places.js';

export const locationsRouter = Router();

// GET /api/destinations?q=cai      (Home / Explore) public
locationsRouter.get('/', async (req, res) => {
  const { q } = listLocationsQuery.parse(req.query);
  const like = q ? `%${q.replace(/[\\%_]/g, '\\$&')}%` : null;
  const { rows } = await query(
    `SELECT l.id, l.name, l.country, l.description,
            (SELECT count(*)::int FROM places p WHERE p.location_id = l.id) AS place_count
       FROM location l
      WHERE $1::text IS NULL OR l.name ILIKE $1 OR l.country ILIKE $1
      ORDER BY l.name
      LIMIT 100`,
    [like],
  );
  res.json({ destinations: rows });
});

// GET /api/destinations/:id        (Destination Details) public
// Returns the destination, plus its hidden gems.
locationsRouter.get('/:id', async (req, res) => {
  const id = uuid.parse(req.params.id);
  const { rows } = await query(`SELECT id, name, country, description FROM location WHERE id = $1`, [id]);
  if (!rows[0]) throw new HttpError(404, 'Destination not found.');
  const gems = await query(
    `SELECT id, name, category, description, local_tip FROM places
      WHERE location_id = $1 AND is_hidden_gem ORDER BY name LIMIT 50`,
    [id],
  );
  res.json({ destination: rows[0], hidden_gems: gems.rows });
});
