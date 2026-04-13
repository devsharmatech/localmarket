-- Add latitude and longitude columns to vendors table
-- Run this SQL in your Supabase SQL Editor

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendors' 
        AND column_name = 'latitude'
    ) THEN
        ALTER TABLE public.vendors 
        ADD COLUMN latitude FLOAT8;
        
        COMMENT ON COLUMN public.vendors.latitude IS 'Geographic latitude coordinate of the shop';
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendors' 
        AND column_name = 'longitude'
    ) THEN
        ALTER TABLE public.vendors 
        ADD COLUMN longitude FLOAT8;
        
        COMMENT ON COLUMN public.vendors.longitude IS 'Geographic longitude coordinate of the shop';
    END IF;
END $$;
