-- Add image columns to vendors table
-- Run this SQL in your Supabase SQL Editor or via psql

-- Add image_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendors' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.vendors 
        ADD COLUMN image_url TEXT;
        
        COMMENT ON COLUMN public.vendors.image_url IS 'URL to the vendor shop image';
    END IF;
END $$;

-- Add shop_front_photo_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendors' 
        AND column_name = 'shop_front_photo_url'
    ) THEN
        ALTER TABLE public.vendors 
        ADD COLUMN shop_front_photo_url TEXT;
        
        COMMENT ON COLUMN public.vendors.shop_front_photo_url IS 'URL to the shop front photo';
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'vendors'
AND column_name IN ('image_url', 'shop_front_photo_url')
ORDER BY column_name;
