-- Migration to add description column to vendor_products table
-- Run this in your Supabase SQL Editor

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendor_products' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.vendor_products 
        ADD COLUMN description TEXT;
        
        COMMENT ON COLUMN public.vendor_products.description IS 'Detailed description of the product or service';
    END IF;
END $$;

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'vendor_products'
AND column_name = 'description';
