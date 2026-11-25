import { Router } from 'express';
import { query } from '../db.js';
import { HttpError } from '../lib/errors.js';
import { shareToken } from '../schemas/trips.js';

export const sharedRouter = Router();

// GET /api/shared/:token    public read-only view of a shared trip. No user id, no email.
sharedRouter.get('/:token', async (req, res) => {
  const token = shareToken.parse(req.params.token);
  const trip = await query(
    `SELECT t.id, t.title, l.name AS location_name, l.country AS location_country,
            t.start_date::text AS start_date, t.end_date::text AS end_date
       FROM trip_shares s JOIN trips t ON t.id = s.trip_id JOIN location l ON l.id = t.location_id
      WHERE s.share_token = $1 AND s.is_active`,
    [token],
  );
  if (!trip.rows[0]) throw new HttpError(404, 'This share link does not exist or was switched off.');
  const items = await query(
    `SELECT a.planned_at, a.notes, p.name AS place_name, p.category, p.address
       FROM appointments a LEFT JOIN places p ON p.id = a.place_id
      WHERE a.trip_id = $1 ORDER BY a.sort_order`,
    [trip.rows[0].id],
  );
  const { id: _id, ...publicTrip } = trip.rows[0];
  res.json({ trip: publicTrip, items: items.rows });
});
