-- =====================================================================
-- Travel guide app: update script. Run once. Nothing is dropped or deleted.
-- Starts from the schema already run: location, users, places, hidden_gem,
-- trips, appointments. Everything runs in one transaction, so a failure
-- changes nothing.
-- =====================================================================
BEGIN;

-- 1. USERS: add the role chosen on Sign Up (tourist, tour guide, trip planner).
--    Existing users become 'tourist'.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'tourist';

ALTER TABLE public.users
    ADD CONSTRAINT chk_users_role
    CHECK (role IN ('tourist', 'tour_guide', 'trip_planner'));

-- 2. USERS: add the password hash for your own login code.
--    Nullable so existing users are kept (they must set a password first).
--    The check rejects anything that is not a hash such as $2b$... (bcrypt)
--    or $argon2id$..., so a plain password cannot be saved by mistake.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE public.users
    ADD CONSTRAINT chk_users_password_hashed
    CHECK (
        password_hash IS NULL
        OR (password_hash ~ '^\$[A-Za-z0-9-]+\$' AND length(password_hash) >= 30)
    );

-- 3. USERS: make email unique ignoring letter case, so Login finds one user.
--    Skipped with a notice if existing emails already differ only by case.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.users GROUP BY lower(email) HAVING count(*) > 1) THEN
        RAISE NOTICE 'uq_users_email_lower skipped: some emails differ only by letter case.';
    ELSE
        CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower
            ON public.users (lower(email));
    END IF;
END $$;

-- 4. USERS: turn on row level security with no policies, so the public API
--    cannot read password_hash. Your server connects with a privileged role.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. PLACES: add what Destination Details and Place Details show:
--    description, local tip, hidden-gem flag and the guide who recommends it.
ALTER TABLE public.places
    ADD COLUMN IF NOT EXISTS description   TEXT,
    ADD COLUMN IF NOT EXISTS local_tip     TEXT,
    ADD COLUMN IF NOT EXISTS is_hidden_gem BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS guide_id      UUID;

-- 6. PLACES: link guide_id to users. If the guide is deleted, the place stays.
ALTER TABLE public.places
    ADD CONSTRAINT fk_places_guide
    FOREIGN KEY (guide_id) REFERENCES public.users(id)
    ON DELETE SET NULL;

-- 7. PLACES: copy old hidden gems that point to a place into the new columns.
--    Gems with no place_id stay untouched in hidden_gem.
UPDATE public.places p
SET is_hidden_gem = TRUE,
    description   = COALESCE(p.description, hg.description),
    local_tip     = COALESCE(p.local_tip, hg.local_tip)
FROM public.hidden_gem hg
WHERE hg.place_id = p.id;

-- 8. PLACES: limit category to the four the filters use. Added after the copy
--    above. NOT VALID checks new and changed rows only, so old rows with other
--    values are kept.
ALTER TABLE public.places
    ADD CONSTRAINT chk_places_category
    CHECK (category IN ('attraction', 'restaurant', 'hotel', 'entertainment'))
    NOT VALID;

-- 9. TRIPS: add interests, the text the Create Trip chips fill in.
--    user_id already links trips to users (ON DELETE CASCADE) and is kept.
ALTER TABLE public.trips
    ADD COLUMN IF NOT EXISTS interests TEXT;

-- 10. APPOINTMENTS (the itinerary items): add sort_order so stops can be
--     moved up and down inside a day.
ALTER TABLE public.appointments
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- 11. APPOINTMENTS: number existing rows per trip by time, then by creation.
UPDATE public.appointments a
SET sort_order = r.rn
FROM (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY trip_id
               ORDER BY planned_at NULLS LAST, created_at, id
           ) AS rn
    FROM public.appointments
) r
WHERE r.id = a.id;

-- 12. APPOINTMENTS: default status to 'places', because "Add to itinerary"
--     on Place Details does not ask for a status.
ALTER TABLE public.appointments
    ALTER COLUMN status SET DEFAULT 'places';

-- 13. TRIP_SHARES (new): the share link on Trip Itinerary, one per trip.
--     The token is random and can be switched off with is_active.
CREATE TABLE IF NOT EXISTS public.trip_shares (
    id          UUID        PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    trip_id     UUID        NOT NULL UNIQUE,
    share_token TEXT        NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_trip_shares_trip
        FOREIGN KEY (trip_id) REFERENCES public.trips(id)
        ON DELETE CASCADE
);

-- 14. TRIP_SHARES: row level security on, no policies, so tokens are only
--     read by your server.
ALTER TABLE public.trip_shares ENABLE ROW LEVEL SECURITY;

-- 15. INDEXES for the page queries (Postgres does not index foreign keys itself).
CREATE INDEX IF NOT EXISTS idx_places_location_category
    ON public.places (location_id, category);
CREATE INDEX IF NOT EXISTS idx_places_hidden_gems
    ON public.places (location_id) WHERE is_hidden_gem;
CREATE INDEX IF NOT EXISTS idx_places_guide
    ON public.places (guide_id);
CREATE INDEX IF NOT EXISTS idx_trips_user
    ON public.trips (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_trip_order
    ON public.appointments (trip_id, sort_order);

COMMIT;
