-- Add KYC and document columns to vendors table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS id_proof_url TEXT,
ADD COLUMN IF NOT EXISTS shop_proof_url TEXT,
ADD COLUMN IF NOT EXISTS id_proof_type TEXT,
ADD COLUMN IF NOT EXISTS shop_proof_type TEXT,
ADD COLUMN IF NOT EXISTS owner_photo_url TEXT,
ADD COLUMN IF NOT EXISTS inside_shop_photo_url TEXT;

COMMENT ON COLUMN public.vendors.id_proof_url IS 'URL to the uploaded ID proof document';
COMMENT ON COLUMN public.vendors.shop_proof_url IS 'URL to the uploaded shop/business proof document';
COMMENT ON COLUMN public.vendors.id_proof_type IS 'Type of ID proof (Aadhar, PAN, etc.)';
COMMENT ON COLUMN public.vendors.shop_proof_type IS 'Type of shop proof (GST, License, etc.)';
COMMENT ON COLUMN public.vendors.owner_photo_url IS 'URL to the owner photo';
COMMENT ON COLUMN public.vendors.inside_shop_photo_url IS 'URL to the inside shop photo';

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vendors' 
AND column_name IN ('id_proof_url', 'shop_proof_url', 'id_proof_type', 'shop_proof_type', 'owner_photo_url', 'inside_shop_photo_url');
