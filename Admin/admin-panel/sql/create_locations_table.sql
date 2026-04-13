-- Create locations table for managing location hierarchy
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  town TEXT NOT NULL,
  tehsil TEXT NOT NULL,
  sub_tehsil TEXT NOT NULL,
  circle TEXT,
  market_icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index to prevent duplicate locations
CREATE UNIQUE INDEX IF NOT EXISTS locations_unique_hierarchy_idx 
  ON public.locations(state, city, town, tehsil, sub_tehsil);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_state ON public.locations(state);
CREATE INDEX IF NOT EXISTS idx_locations_city ON public.locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_town ON public.locations(town);
CREATE INDEX IF NOT EXISTS idx_locations_tehsil ON public.locations(tehsil);
CREATE INDEX IF NOT EXISTS idx_locations_circle ON public.locations(circle);
CREATE INDEX IF NOT EXISTS idx_locations_state_city ON public.locations(state, city);

-- Enable RLS (Row Level Security)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (adjust based on your security needs)
CREATE POLICY IF NOT EXISTS "Allow all operations on locations"
  ON public.locations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.locations IS 'Location hierarchy: State > City > Town > Tehsil > Sub-Tehsil';
COMMENT ON COLUMN public.locations.state IS 'State name';
COMMENT ON COLUMN public.locations.city IS 'City name';
COMMENT ON COLUMN public.locations.town IS 'Town name';
COMMENT ON COLUMN public.locations.tehsil IS 'Tehsil name';
COMMENT ON COLUMN public.locations.sub_tehsil IS 'Sub-Tehsil name';
COMMENT ON COLUMN public.locations.circle IS 'Circle/Region name (optional)';

-- Verify the table was created
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'locations'
ORDER BY ordinal_position;
