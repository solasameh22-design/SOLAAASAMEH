# Travel guide back end

Express 5 + PostgreSQL (Supabase) + own login (bcrypt password hashes, JWT in an HttpOnly cookie).
Roles: tourist, tour_guide, trip_planner.

## Setup
```
npm install
cp .env.example .env      # fill in DATABASE_URL and JWT_SECRET
```
Run `sql/update_schema.sql` once in the Supabase SQL editor (after your old schema, `sql/schema.sql`).

## Run
```
npm run dev:api     # API on http://localhost:3001
npm run typecheck:api
```
Never commit `.env`. On Vercel, set `DATABASE_URL` and `JWT_SECRET` in the project settings.

## Routes
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/destinations`, `GET /api/destinations/:id`
- `GET /api/places`, `GET /api/places/:id`, `POST|PATCH|DELETE /api/places` (tour guides only, own places)
- `GET|POST /api/trips`, `GET|PATCH|DELETE /api/trips/:id`
- `POST /api/trips/:id/items`, `PATCH /api/trips/:id/items/reorder`, `PATCH|DELETE /api/trips/:id/items/:itemId`
- `PUT /api/trips/:id/share`, `GET /api/shared/:token` (public)

Status: the SQL and the zod validation rules were tested; the Express code has not been run yet.

`frontend-example/` holds the Vite proxy config and the Trip Itinerary page to copy into your React project; it is not part of this API build.
