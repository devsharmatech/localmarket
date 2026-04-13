-- Create users table if it doesn't exist
-- Run this SQL in your Supabase SQL Editor or via psql

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL UNIQUE,
  state TEXT,
  city TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Blocked', 'Pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON public.users(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_state_city ON public.users(state, city);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow service role to access everything)
-- Note: In production, you should create proper policies based on admin roles
-- For now, we'll rely on service role key which bypasses RLS

-- Create a policy that allows all operations for service role (for admin panel)
-- This is a placeholder - adjust based on your security requirements
CREATE POLICY IF NOT EXISTS "Service role can manage users"
  ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'User accounts for the Local Market application';
COMMENT ON COLUMN public.users.full_name IS 'Full name of the user';
COMMENT ON COLUMN public.users.email IS 'Email address (optional)';
COMMENT ON COLUMN public.users.phone IS 'Phone number (unique, required for authentication)';
COMMENT ON COLUMN public.users.state IS 'State where user is located';
COMMENT ON COLUMN public.users.city IS 'City where user is located';
COMMENT ON COLUMN public.users.status IS 'User status: Active, Blocked, or Pending';
COMMENT ON COLUMN public.users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN public.users.last_active_at IS 'Last activity timestamp';
COMMENT ON COLUMN public.users.updated_at IS 'Last update timestamp';

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify table creation
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;
