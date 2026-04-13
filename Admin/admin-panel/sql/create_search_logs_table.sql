-- Create search_logs table for tracking search activity
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  search_query TEXT NOT NULL,
  location_state TEXT,
  location_city TEXT,
  location_town TEXT,
  location_circle TEXT,
  results_count INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON public.search_logs(search_query);
CREATE INDEX IF NOT EXISTS idx_search_logs_searched_at ON public.search_logs(searched_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_location ON public.search_logs(location_state, location_city, location_town);
CREATE INDEX IF NOT EXISTS idx_search_logs_location_circle ON public.search_logs(location_circle);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON public.search_logs(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on search_logs"
  ON public.search_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify the table was created
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'search_logs'
ORDER BY ordinal_position;
