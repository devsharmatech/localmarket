-- Add missing columns to vendors table for dummy data generation
-- Run this SQL in your Supabase SQL Editor or via psql

-- Add category column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendors' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public.vendors 
        ADD COLUMN category TEXT;
        
        COMMENT ON COLUMN public.vendors.category IS 'Business category or shop type';
    END IF;
END $$;

-- Add owner column if it doesn't exist (in case only owner_name exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendors' 
        AND column_name = 'owner'
    ) THEN
        ALTER TABLE public.vendors 
        ADD COLUMN owner TEXT;
        
        COMMENT ON COLUMN public.vendors.owner IS 'Owner/Proprietor name';
    END IF;
END $$;

-- Add owner_name column if it doesn't exist (in case only owner exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendors' 
        AND column_name = 'owner_name'
    ) THEN
        ALTER TABLE public.vendors 
        ADD COLUMN owner_name TEXT;
        
        COMMENT ON COLUMN public.vendors.owner_name IS 'Owner/Proprietor name (alternative column name)';
    END IF;
END $$;

-- Verify all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'vendors'
AND column_name IN ('category', 'owner', 'owner_name', 'contact_number', 'email', 'state', 'city', 'town', 'tehsil', 'sub_tehsil', 'circle', 'status', 'kyc_status', 'created_at', 'last_active')
ORDER BY column_name;
