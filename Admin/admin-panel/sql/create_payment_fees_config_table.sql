-- Create payment_fees_config table for storing payment fees configuration
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.payment_fees_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 999,
  six_monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 4999,
  yearly_fee NUMERIC(10,2) NOT NULL DEFAULT 8999,
  grace_period_days INTEGER NOT NULL DEFAULT 7,
  auto_block_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_fees_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_fees_config_updated_at
  BEFORE UPDATE ON public.payment_fees_config
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_fees_config_updated_at();

-- Insert default configuration if it doesn't exist
INSERT INTO public.payment_fees_config (id, monthly_fee, six_monthly_fee, yearly_fee, grace_period_days, auto_block_enabled)
VALUES ('default', 999, 4999, 8999, 7, true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE public.payment_fees_config ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on payment_fees_config"
  ON public.payment_fees_config
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify the table was created
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'payment_fees_config'
ORDER BY ordinal_position;
