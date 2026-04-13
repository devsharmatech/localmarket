-- Add selected_theme column to users table
-- This allows each user to have their own theme preference

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'selected_theme'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN selected_theme TEXT DEFAULT 'default';
    
    -- Add comment
    COMMENT ON COLUMN public.users.selected_theme IS 'User-selected festival theme preference (default, diwali, holi, eid, christmas, newYear, etc.)';
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_selected_theme ON public.users(selected_theme);

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name = 'selected_theme';
