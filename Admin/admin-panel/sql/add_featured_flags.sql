-- SQL Migration: Add featured content flags to vendors and vendor_products
-- Run this in your Supabase SQL Editor

-- 1. Add flags to vendors
DO $$ 
BEGIN
    -- is_verified
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendors' 
        AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE public.vendors 
        ADD COLUMN is_verified BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN public.vendors.is_verified IS 'Whether this vendor is a verified/trusted partner';
    END IF;

    -- is_featured
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendors' 
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE public.vendors 
        ADD COLUMN is_featured BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN public.vendors.is_featured IS 'Whether this vendor should be featured on the home page';
    END IF;
END $$;

-- 2. Add featured flags to vendor_products
DO $$ 
BEGIN
    -- is_featured
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendor_products' 
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE public.vendor_products 
        ADD COLUMN is_featured BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN public.vendor_products.is_featured IS 'Whether this product should be featured on the home page (Today''s Deals)';
    END IF;

    -- is_price_drop
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendor_products' 
        AND column_name = 'is_price_drop'
    ) THEN
        ALTER TABLE public.vendor_products 
        ADD COLUMN is_price_drop BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN public.vendor_products.is_price_drop IS 'Whether this product is currently under a significant price drop';
    END IF;

    -- is_mega_saving
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendor_products' 
        AND column_name = 'is_mega_saving'
    ) THEN
        ALTER TABLE public.vendor_products 
        ADD COLUMN is_mega_saving BOOLEAN DEFAULT false;
        
        COMMENT ON COLUMN public.vendor_products.is_mega_saving IS 'Whether this product offers mega savings compared to online prices';
    END IF;

    -- online_price
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendor_products' 
        AND column_name = 'online_price'
    ) THEN
        ALTER TABLE public.vendor_products 
        ADD COLUMN online_price NUMERIC(10,2);
        
        COMMENT ON COLUMN public.vendor_products.online_price IS 'Estimated online market price for comparison';
    END IF;
END $$;

-- Create indexes for these new filters
CREATE INDEX IF NOT EXISTS idx_vendors_is_verified ON public.vendors(is_verified);
CREATE INDEX IF NOT EXISTS idx_vendors_is_featured ON public.vendors(is_featured);
CREATE INDEX IF NOT EXISTS idx_vendor_products_is_featured ON public.vendor_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_vendor_products_is_price_drop ON public.vendor_products(is_price_drop);
CREATE INDEX IF NOT EXISTS idx_vendor_products_is_mega_saving ON public.vendor_products(is_mega_saving);

-- Log the successful migration
COMMENT ON TABLE public.vendors IS 'Updated with is_verified flag for home page highlights';
COMMENT ON TABLE public.vendor_products IS 'Updated with is_featured, is_price_drop, is_mega_saving flags for home page sections';

-- 3. Populate Initial Home Page Highlights (Smart Seeding)
-- This section will intelligently mark your existing data to bring the home page to life immediately.

-- A. Mark active vendors as Verified & Featured
UPDATE public.vendors 
SET is_verified = true, is_featured = true
WHERE status = 'Active' 
AND id IN (
    SELECT id FROM public.vendors 
    WHERE status = 'Active' 
    LIMIT 10
);

-- B. Mark products with the biggest MRP discounts as "Price Drops"
UPDATE public.vendor_products
SET is_price_drop = true
WHERE is_active = true 
AND mrp > price
AND id IN (
    SELECT id FROM public.vendor_products
    WHERE is_active = true AND mrp > price
    ORDER BY (mrp - price) DESC
    LIMIT 10
);

-- C. Mark products with the biggest online savings as "Mega Savings"
-- First, ensure we have some sample online prices to compare against
UPDATE public.vendor_products
SET online_price = ROUND(price * 1.32)
WHERE (online_price IS NULL OR online_price = 0)
AND is_active = true
AND id IN (
    SELECT id FROM public.vendor_products 
    WHERE is_active = true 
    LIMIT 20
);

UPDATE public.vendor_products
SET is_mega_saving = true
WHERE is_active = true 
AND online_price > price
AND id IN (
    SELECT id FROM public.vendor_products
    WHERE is_active = true AND online_price > price
    ORDER BY (online_price - price) DESC
    LIMIT 10
);

-- D. Mark random active products as "Today's Deals"
UPDATE public.vendor_products
SET is_featured = true
WHERE is_active = true
AND id IN (
    SELECT id FROM public.vendor_products
    WHERE is_active = true
    LIMIT 15
);
