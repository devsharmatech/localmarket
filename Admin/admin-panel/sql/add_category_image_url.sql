-- Add image_url column to categories table
-- Run this SQL in your Supabase SQL Editor

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.categories 
        ADD COLUMN image_url TEXT;
        
        COMMENT ON COLUMN public.categories.image_url IS 'URL to the larger representative image for the category';
    END IF;
END $$;

-- Verify the column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'categories'
AND column_name = 'image_url';
