-- Add image_url column to festive_offers table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'festive_offers' AND COLUMN_NAME = 'image_url') THEN
        ALTER TABLE public.festive_offers ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'festive_offers' AND COLUMN_NAME = 'vendor_name') THEN
        ALTER TABLE public.festive_offers ADD COLUMN vendor_name TEXT;
    END IF;
END $$;
