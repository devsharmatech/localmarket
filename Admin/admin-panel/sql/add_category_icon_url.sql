-- Add icon_url column to categories table
-- Run this SQL in your Supabase SQL Editor

-- Add icon_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'icon_url'
    ) THEN
        ALTER TABLE public.categories 
        ADD COLUMN icon_url TEXT;
        
        COMMENT ON COLUMN public.categories.icon_url IS 'URL to the category icon image';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'categories'
AND column_name = 'icon_url';
