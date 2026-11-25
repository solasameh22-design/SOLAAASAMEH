-- 1. LOCATION: Stores travel destinations
CREATE TABLE public.location (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    description TEXT
);
-- 2. USERS: Stores user profile information
-- Authentication should be managed separately by Supabase Auth.
CREATE TABLE public.users (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);
-- 3. PLACES: Stores attractions, restaurants, hotels, and other places
CREATE TABLE public.places (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    location_id UUID NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    address TEXT,
    booking_url TEXT,
    CONSTRAINT fk_places_location
        FOREIGN KEY (location_id)
        REFERENCES public.location(id)
        ON DELETE CASCADE
);
-- 4. HIDDEN_GEM: Stores hidden gems and local tips
CREATE TABLE public.hidden_gem (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    location_id UUID NOT NULL,
    place_id UUID,
    description TEXT NOT NULL,
    local_tip TEXT,
    CONSTRAINT fk_hidden_gem_location
        FOREIGN KEY (location_id)
        REFERENCES public.location(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_hidden_gem_place
        FOREIGN KEY (place_id)
        REFERENCES public.places(id)
        ON DELETE SET NULL
);
-- 5. TRIPS: Stores trips created by users
CREATE TABLE public.trips (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id UUID NOT NULL,
    location_id UUID NOT NULL,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget NUMERIC(12, 2),
    status TEXT NOT NULL DEFAULT 'planned',
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_trips_user
        FOREIGN KEY (user_id)
        REFERENCES public.users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_trips_location
        FOREIGN KEY (location_id)
        REFERENCES public.location(id)
        ON DELETE RESTRICT,
    CONSTRAINT chk_trips_dates
        CHECK (end_date >= start_date),
    CONSTRAINT chk_trips_budget
        CHECK (budget IS NULL OR budget >= 0)
);
-- 6. APPOINTMENTS: Stores planned places and hidden gems within trips
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    trip_id UUID NOT NULL,
    place_id UUID,
    hidden_gem_id UUID,
    planned_at TIMESTAMPTZ,
    notes TEXT,
    status TEXT NOT NULL,
    booking_url TEXT,
    CONSTRAINT fk_appointments_trip
        FOREIGN KEY (trip_id)
        REFERENCES public.trips(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_appointments_place
        FOREIGN KEY (place_id)
        REFERENCES public.places(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_appointments_hidden_gem
        FOREIGN KEY (hidden_gem_id)
        REFERENCES public.hidden_gem(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_appointments_status
        CHECK (status IN ('location', 'places', 'hidden_gem')),
    CONSTRAINT chk_appointments_target
        CHECK (
            (place_id IS NOT NULL AND hidden_gem_id IS NULL)
            OR
            (place_id IS NULL AND hidden_gem_id IS NOT NULL)
        )
);
