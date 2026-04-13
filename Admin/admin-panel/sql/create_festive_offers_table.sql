-- Create festive_offers table for storing festive offers and promotions
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.festive_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'vendor' or 'user'
  target TEXT NOT NULL, -- 'all', 'circle', 'specific'
  circle TEXT,
  vendor_ids UUID[], -- Array of vendor IDs if target='specific'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  discount_percent NUMERIC(5,2),
  description TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_festive_offers_status ON public.festive_offers(status);
CREATE INDEX IF NOT EXISTS idx_festive_offers_dates ON public.festive_offers(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_festive_offers_type ON public.festive_offers(type);
CREATE INDEX IF NOT EXISTS idx_festive_offers_target ON public.festive_offers(target);

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_festive_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER festive_offers_updated_at
  BEFORE UPDATE ON public.festive_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_festive_offers_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE public.festive_offers ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on festive_offers"
  ON public.festive_offers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify the table was created
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'festive_offers'
ORDER BY ordinal_position;
