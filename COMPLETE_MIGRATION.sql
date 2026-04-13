-- ========================================================
-- MASTER LOCALMARKET SUPABASE RESTORATION SCRIPT
-- Compiles ALL schema files for safe recreation on Hostinger
-- ========================================================

-- =========================================
-- FILE: create_users_table.sql
-- =========================================
-- Create users table if it doesn't exist
-- Run this SQL in your Supabase SQL Editor or via psql

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL UNIQUE,
  state TEXT,
  city TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Blocked', 'Pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  password TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON public.users(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_state_city ON public.users(state, city);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow service role to access everything)
-- Note: In production, you should create proper policies based on admin roles
-- For now, we'll rely on service role key which bypasses RLS

-- Create a policy that allows all operations for service role (for admin panel)
-- This is a placeholder - adjust based on your security requirements
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
CREATE POLICY "Service role can manage users"
  ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.users IS 'User accounts for the Local Market application';
COMMENT ON COLUMN public.users.full_name IS 'Full name of the user';
COMMENT ON COLUMN public.users.email IS 'Email address (optional)';
COMMENT ON COLUMN public.users.phone IS 'Phone number (unique, required for authentication)';
COMMENT ON COLUMN public.users.state IS 'State where user is located';
COMMENT ON COLUMN public.users.city IS 'City where user is located';
COMMENT ON COLUMN public.users.status IS 'User status: Active, Blocked, or Pending';
COMMENT ON COLUMN public.users.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN public.users.last_active_at IS 'Last activity timestamp';
COMMENT ON COLUMN public.users.updated_at IS 'Last update timestamp';

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify table creation
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;


-- =========================================
-- FILE: ensure_vendor_products_table.sql
-- =========================================
-- Ensure vendor_products table exists with all required columns
-- This table links products to vendors with vendor-specific pricing

-- Create vendor_products table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vendor_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10,2),
    mrp NUMERIC(10,2),
    uom TEXT, -- Unit of Measure (kg, piece, litre, etc.)
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendor_products' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.vendor_products 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        COMMENT ON COLUMN public.vendor_products.is_active IS 'Whether this product is currently active/available';
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor_id ON public.vendor_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_category_id ON public.vendor_products(category_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_name ON public.vendor_products(name);

-- Add is_active index only if column exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendor_products' 
        AND column_name = 'is_active'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_vendor_products_is_active ON public.vendor_products(is_active);
    END IF;
END $$;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_vendor_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vendor_products_updated_at ON public.vendor_products;
CREATE TRIGGER trigger_update_vendor_products_updated_at
    BEFORE UPDATE ON public.vendor_products
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_products_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Allow public read access to vendor_products" ON public.vendor_products;
CREATE POLICY "Allow public read access to vendor_products"
    ON public.vendor_products
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert to vendor_products" ON public.vendor_products;
CREATE POLICY "Allow authenticated insert to vendor_products"
    ON public.vendor_products
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update to vendor_products" ON public.vendor_products;
CREATE POLICY "Allow authenticated update to vendor_products"
    ON public.vendor_products
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete to vendor_products" ON public.vendor_products;
CREATE POLICY "Allow authenticated delete to vendor_products"
    ON public.vendor_products
    FOR DELETE
    USING (true);

-- Add comments
COMMENT ON TABLE public.vendor_products IS 'Vendor-specific products with pricing. Each vendor can have different prices for the same product.';
COMMENT ON COLUMN public.vendor_products.vendor_id IS 'Reference to the vendor who sells this product';
COMMENT ON COLUMN public.vendor_products.name IS 'Product name';
COMMENT ON COLUMN public.vendor_products.price IS 'Selling price set by the vendor';
COMMENT ON COLUMN public.vendor_products.mrp IS 'Maximum Retail Price (MRP)';
COMMENT ON COLUMN public.vendor_products.uom IS 'Unit of Measure (kg, piece, litre, etc.)';
COMMENT ON COLUMN public.vendor_products.category_id IS 'Product category reference';

-- Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'vendor_products'
ORDER BY ordinal_position;


-- =========================================
-- FILE: create_enquiries_table.sql
-- =========================================
-- Create enquiries table for customer-to-vendor messages
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new', -- 'new', 'responded', 'closed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (anyone can send an enquiry)
DROP POLICY IF EXISTS "Allow public insert" ON public.enquiries;
CREATE POLICY "Allow public insert" ON public.enquiries
  FOR INSERT WITH CHECK (true);

-- Allow related vendor or admin to select
DROP POLICY IF EXISTS "Allow vendor/admin select" ON public.enquiries;
CREATE POLICY "Allow vendor/admin select" ON public.enquiries
  FOR SELECT USING (true); -- Simplifying for now, can be restricted later

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_enquiries_vendor_id ON public.enquiries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at);


-- =========================================
-- FILE: create_festive_offers_table.sql
-- =========================================
-- Create festive_offers table for storing festive offers and promotions
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.festive_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'vendor' or 'user'
  target TEXT NOT NULL, -- 'all', 'circle', 'specific'
  circle TEXT,
  vendor_ids UUID[], -- Array of vendor IDs if target='specific'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  discount_percent NUMERIC(5,2),
  description TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_festive_offers_status ON public.festive_offers(status);
CREATE INDEX IF NOT EXISTS idx_festive_offers_dates ON public.festive_offers(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_festive_offers_type ON public.festive_offers(type);
CREATE INDEX IF NOT EXISTS idx_festive_offers_target ON public.festive_offers(target);

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_festive_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER festive_offers_updated_at
  BEFORE UPDATE ON public.festive_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_festive_offers_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE public.festive_offers ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (adjust based on your security needs)
DROP POLICY IF EXISTS "Allow all operations on festive_offers" ON festive_offers;
CREATE POLICY "Allow all operations on festive_offers"
  ON public.festive_offers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify the table was created
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'festive_offers'
ORDER BY ordinal_position;


-- =========================================
-- FILE: create_locations_table.sql
-- =========================================
-- Create locations table for managing location hierarchy
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  town TEXT NOT NULL,
  tehsil TEXT NOT NULL,
  sub_tehsil TEXT NOT NULL,
  circle TEXT,
  market_icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index to prevent duplicate locations
CREATE UNIQUE INDEX IF NOT EXISTS locations_unique_hierarchy_idx 
  ON public.locations(state, city, town, tehsil, sub_tehsil);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_state ON public.locations(state);
CREATE INDEX IF NOT EXISTS idx_locations_city ON public.locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_town ON public.locations(town);
CREATE INDEX IF NOT EXISTS idx_locations_tehsil ON public.locations(tehsil);
CREATE INDEX IF NOT EXISTS idx_locations_circle ON public.locations(circle);
CREATE INDEX IF NOT EXISTS idx_locations_state_city ON public.locations(state, city);

-- Enable RLS (Row Level Security)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (adjust based on your security needs)
DROP POLICY IF EXISTS "Allow all operations on locations" ON locations;
CREATE POLICY "Allow all operations on locations"
  ON public.locations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.locations IS 'Location hierarchy: State > City > Town > Tehsil > Sub-Tehsil';
COMMENT ON COLUMN public.locations.state IS 'State name';
COMMENT ON COLUMN public.locations.city IS 'City name';
COMMENT ON COLUMN public.locations.town IS 'Town name';
COMMENT ON COLUMN public.locations.tehsil IS 'Tehsil name';
COMMENT ON COLUMN public.locations.sub_tehsil IS 'Sub-Tehsil name';
COMMENT ON COLUMN public.locations.circle IS 'Circle/Region name (optional)';

-- Verify the table was created
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'locations'
ORDER BY ordinal_position;


-- =========================================
-- FILE: create_payment_fees_config_table.sql
-- =========================================
-- Create payment_fees_config table for storing payment fees configuration
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.payment_fees_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 999,
  six_monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 4999,
  yearly_fee NUMERIC(10,2) NOT NULL DEFAULT 8999,
  grace_period_days INTEGER NOT NULL DEFAULT 7,
  auto_block_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_fees_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_fees_config_updated_at
  BEFORE UPDATE ON public.payment_fees_config
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_fees_config_updated_at();

-- Insert default configuration if it doesn't exist
INSERT INTO public.payment_fees_config (id, monthly_fee, six_monthly_fee, yearly_fee, grace_period_days, auto_block_enabled)
VALUES ('default', 999, 4999, 8999, 7, true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE public.payment_fees_config ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (adjust based on your security needs)
DROP POLICY IF EXISTS "Allow all operations on payment_fees_config" ON payment_fees_config;
CREATE POLICY "Allow all operations on payment_fees_config"
  ON public.payment_fees_config
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify the table was created
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'payment_fees_config'
ORDER BY ordinal_position;


-- =========================================
-- FILE: create_reviews_table.sql
-- =========================================
-- Create reviews table for vendor reviews
-- This table stores user reviews/ratings for vendors

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    reply TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on vendor_id for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON public.reviews(vendor_id);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Add comment to table
COMMENT ON TABLE public.reviews IS 'User reviews and ratings for vendors';

-- Add comments to columns
COMMENT ON COLUMN public.reviews.vendor_id IS 'ID of the vendor being reviewed';
COMMENT ON COLUMN public.reviews.user_id IS 'ID of the user who wrote the review (optional)';
COMMENT ON COLUMN public.reviews.user_name IS 'Name of the user who wrote the review';
COMMENT ON COLUMN public.reviews.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN public.reviews.comment IS 'Review comment text';
COMMENT ON COLUMN public.reviews.reply IS 'Vendor reply to the review (optional)';


-- =========================================
-- FILE: create_search_logs_table.sql
-- =========================================
-- Create search_logs table for tracking search activity
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  search_query TEXT NOT NULL,
  location_state TEXT,
  location_city TEXT,
  location_town TEXT,
  location_circle TEXT,
  results_count INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON public.search_logs(search_query);
CREATE INDEX IF NOT EXISTS idx_search_logs_searched_at ON public.search_logs(searched_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_location ON public.search_logs(location_state, location_city, location_town);
CREATE INDEX IF NOT EXISTS idx_search_logs_location_circle ON public.search_logs(location_circle);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON public.search_logs(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (adjust based on your security needs)
DROP POLICY IF EXISTS "Allow all operations on search_logs" ON search_logs;
CREATE POLICY "Allow all operations on search_logs"
  ON public.search_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify the table was created
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'search_logs'
ORDER BY ordinal_position;


-- =========================================
-- FILE: add_banner_location_columns.sql
-- =========================================
-- SQL Migration: Add location targeting to banners
-- Run this in your Supabase SQL Editor

DO $$ 
BEGIN
    -- target_city
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'banners' 
        AND column_name = 'target_city'
    ) THEN
        ALTER TABLE public.banners 
        ADD COLUMN target_city TEXT;
        
        COMMENT ON COLUMN public.banners.target_city IS 'Specific city this banner is targeted at';
    END IF;

    -- target_circle
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'banners' 
        AND column_name = 'target_circle'
    ) THEN
        ALTER TABLE public.banners 
        ADD COLUMN target_circle TEXT;
        
        COMMENT ON COLUMN public.banners.target_circle IS 'Specific circle/market this banner is targeted at';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_banners_target_city ON public.banners(target_city);
CREATE INDEX IF NOT EXISTS idx_banners_target_circle ON public.banners(target_circle);

-- Log success
COMMENT ON TABLE public.banners IS 'Updated with location-based targeting (target_city, target_circle)';


-- =========================================
-- FILE: add_category_icon_url.sql
-- =========================================
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

    -- Add visible column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'visible'
    ) THEN
        ALTER TABLE public.categories 
        ADD COLUMN visible BOOLEAN DEFAULT true;
        
        COMMENT ON COLUMN public.categories.visible IS 'Whether this category is visible in the frontend shortcut list';
    END IF;

    -- Add priority column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE public.categories 
        ADD COLUMN priority INTEGER DEFAULT 999;
        
        COMMENT ON COLUMN public.categories.priority IS 'Priority for sorting categories (lower numbers first)';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'categories'
AND column_name = 'icon_url';


-- =========================================
-- FILE: add_category_image_url.sql
-- =========================================
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


-- =========================================
-- FILE: add_description_to_vendor_products.sql
-- =========================================
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


-- =========================================
-- FILE: add_featured_flags.sql
-- =========================================
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


-- =========================================
-- FILE: add_image_url_to_festive_offers.sql
-- =========================================
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


-- =========================================
-- FILE: add_kyc_columns.sql
-- =========================================
-- Add KYC and document columns to vendors table
-- Run this SQL in your Supabase SQL Editor

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vendors' AND column_name='id_proof_url') THEN
        ALTER TABLE public.vendors ADD COLUMN id_proof_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vendors' AND column_name='shop_proof_url') THEN
        ALTER TABLE public.vendors ADD COLUMN shop_proof_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vendors' AND column_name='id_proof_type') THEN
        ALTER TABLE public.vendors ADD COLUMN id_proof_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vendors' AND column_name='shop_proof_type') THEN
        ALTER TABLE public.vendors ADD COLUMN shop_proof_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vendors' AND column_name='owner_photo_url') THEN
        ALTER TABLE public.vendors ADD COLUMN owner_photo_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vendors' AND column_name='inside_shop_photo_url') THEN
        ALTER TABLE public.vendors ADD COLUMN inside_shop_photo_url TEXT;
    END IF;
END $$;

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


-- =========================================
-- FILE: add_location_to_vendors.sql
-- =========================================
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


-- =========================================
-- FILE: add_password_to_users.sql
-- =========================================
-- Add password column to users table for email login
-- Run this SQL in your Supabase SQL Editor

-- Add password column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'password'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN password TEXT;
        
        COMMENT ON COLUMN public.users.password IS 'Hashed password for email login (optional, only for email-based accounts)';
    END IF;
END $$;

-- Add OTP columns for SMS login
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'otp'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN otp TEXT;
        
        COMMENT ON COLUMN public.users.otp IS 'Temporary OTP for SMS login verification';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'otp_expires_at'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN otp_expires_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.users.otp_expires_at IS 'OTP expiration timestamp';
    END IF;
END $$;

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN ('password', 'otp', 'otp_expires_at')
ORDER BY ordinal_position;


-- =========================================
-- FILE: add_subscription_banner_columns.sql
-- =========================================
-- Add subscription banner columns to payment_fees_config table
-- Run this in Supabase SQL Editor

ALTER TABLE payment_fees_config
  ADD COLUMN IF NOT EXISTS banner_enabled  BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS banner_badge    TEXT    DEFAULT '🚀 Registration Offer',
  ADD COLUMN IF NOT EXISTS banner_title    TEXT    DEFAULT 'Activate Your Vendor Account',
  ADD COLUMN IF NOT EXISTS banner_subtitle TEXT    DEFAULT 'Choose a subscription plan to start selling on Local Market and reach thousands of customers in your area.',
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT   DEFAULT NULL;

-- Ensure a default row exists
INSERT INTO payment_fees_config (id, monthly_fee, six_monthly_fee, yearly_fee, grace_period_days, auto_block_enabled, banner_enabled, banner_badge, banner_title, banner_subtitle, banner_image_url)
VALUES (
  'default',
  999,
  4999,
  8999,
  7,
  true,
  true,
  '🚀 Registration Offer',
  'Activate Your Vendor Account',
  'Choose a subscription plan to start selling on Local Market and reach thousands of customers in your area.',
  NULL
)
ON CONFLICT (id) DO NOTHING;


-- =========================================
-- FILE: add_theme_to_users.sql
-- =========================================
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


-- =========================================
-- FILE: add_vendor_columns.sql
-- =========================================
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

    -- Add selected_theme column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='address') THEN
        ALTER TABLE public.vendors ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='landmark') THEN
        ALTER TABLE public.vendors ADD COLUMN landmark TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='pincode') THEN
        ALTER TABLE public.vendors ADD COLUMN pincode TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendors' 
        AND column_name = 'selected_theme'
    ) THEN
        ALTER TABLE public.vendors 
        ADD COLUMN selected_theme TEXT DEFAULT 'default';
        
        COMMENT ON COLUMN public.vendors.selected_theme IS 'Vendor-selected festival theme preference';
    END IF;

    -- Add password column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='password') THEN
        ALTER TABLE public.vendors ADD COLUMN password TEXT;
    END IF;

    -- Add product_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='product_count') THEN
        ALTER TABLE public.vendors ADD COLUMN product_count INTEGER DEFAULT 0;
    END IF;

    -- Add display_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='display_id') THEN
        ALTER TABLE public.vendors ADD COLUMN display_id TEXT;
    END IF;

    -- Add rating and review_count columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='rating') THEN
        ALTER TABLE public.vendors ADD COLUMN rating NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='review_count') THEN
        ALTER TABLE public.vendors ADD COLUMN review_count INTEGER DEFAULT 0;
    END IF;

    -- Add image and photo columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='shop_front_photo_url') THEN
        ALTER TABLE public.vendors ADD COLUMN shop_front_photo_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendors' AND column_name='image_url') THEN
        ALTER TABLE public.vendors ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- =========================================
-- STORAGE RLS POLICIES
-- =========================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    bucket_name TEXT;
    buckets TEXT[] := ARRAY['vendor-documents', 'general', 'product-images', 'category-icons'];
BEGIN
    FOREACH bucket_name IN ARRAY buckets
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Permit All Select %s" ON storage.objects', bucket_name);
        EXECUTE format('CREATE POLICY "Permit All Select %s" ON storage.objects FOR SELECT USING (bucket_id = %L)', bucket_name, bucket_name);

        EXECUTE format('DROP POLICY IF EXISTS "Permit All Insert %s" ON storage.objects', bucket_name);
        EXECUTE format('CREATE POLICY "Permit All Insert %s" ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L)', bucket_name, bucket_name);

        EXECUTE format('DROP POLICY IF EXISTS "Permit All Update %s" ON storage.objects', bucket_name);
        EXECUTE format('CREATE POLICY "Permit All Update %s" ON storage.objects FOR UPDATE USING (bucket_id = %L)', bucket_name, bucket_name);
    END LOOP;
END $$;

-- Verify all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'vendors'
AND column_name IN ('category', 'owner', 'owner_name', 'contact_number', 'email', 'state', 'city', 'town', 'tehsil', 'sub_tehsil', 'circle', 'status', 'kyc_status', 'created_at', 'last_active_at')
ORDER BY column_name;


-- =========================================
-- FILE: add_vendor_image_columns.sql
-- =========================================
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

    -- Add last_active_at column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendors' 
        AND column_name = 'last_active_at'
    ) THEN
        ALTER TABLE public.vendors 
        ADD COLUMN last_active_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.vendors.last_active_at IS 'Last activity timestamp';
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


-- =========================================
-- FILE: market_comparison_logic.sql
-- =========================================
-- LOKALL Market Comparison Logic
-- Implements the "% Lower Price" comparison as described in the documentation.
-- Scalable for lakhs of products.

-- 1. Create a View to calculate average prices per product in each circle
CREATE OR REPLACE VIEW public.circle_product_averages AS
SELECT 
    v.city,
    v.circle,
    p.name as product_name,
    AVG(p.price) as avg_price,
    COUNT(*) as vendor_count
FROM 
    public.vendor_products p
JOIN 
    public.vendors v ON p.vendor_id = v.id
WHERE 
    p.is_active = true 
    AND v.status = 'Active'
    AND v.city IS NOT NULL 
    AND v.circle IS NOT NULL
GROUP BY 
    v.city, v.circle, p.name;

-- 2. Create the Market Comparison Stats View
-- This compares each circle's prices against all OTHER circles in the same city for the SAME products.
CREATE OR REPLACE VIEW public.market_comparison_stats AS
WITH other_circles_avg AS (
    -- For each product in a circle, find the average price in ALL OTHER circles of the same city
    SELECT 
        a.city,
        a.circle,
        a.product_name,
        a.avg_price as this_circle_price,
        AVG(b.avg_price) as other_circles_price
    FROM 
        public.circle_product_averages a
    JOIN 
        public.circle_product_averages b ON a.product_name = b.product_name 
                                        AND a.city = b.city 
                                        AND a.circle != b.circle
    GROUP BY 
        a.city, a.circle, a.product_name, a.avg_price
),
circle_savings AS (
    -- Aggregate the savings across all common products for each circle
    SELECT 
        city,
        circle,
        AVG(other_circles_price) as city_avg_on_common,
        AVG(this_circle_price) as circle_avg_on_common,
        COUNT(*) as common_products_count
    FROM 
        other_circles_avg
    GROUP BY 
        city, circle
)
SELECT 
    city,
    circle,
    common_products_count,
    ROUND(circle_avg_on_common, 2) as avg_price_here,
    ROUND(city_avg_on_common, 2) as avg_price_elsewhere,
    -- Formula: ((OtherAvg - ThisAvg) / OtherAvg) * 100
    CASE 
        WHEN city_avg_on_common > 0 THEN 
            ROUND(((city_avg_on_common - circle_avg_on_common) / city_avg_on_common) * 100, 1)
        ELSE 0 
    END as lower_price_pct
FROM 
    circle_savings;

-- 3. Comments and helper indexes (ensure performance)
COMMENT ON VIEW public.market_comparison_stats IS 'Calculates the percentage price advantage for each market (circle) compared to others in the same city.';

-- Ensure indexes exist for the join performance
CREATE INDEX IF NOT EXISTS idx_vendor_products_active_name ON public.vendor_products(is_active, name);
CREATE INDEX IF NOT EXISTS idx_vendors_city_circle_status ON public.vendors(city, circle, status);


-- =========================================
-- FILE: site_settings.sql
-- =========================================
-- Global Site Settings for support contact and branding
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  support_phone TEXT NOT NULL DEFAULT '+91 98765 43210',
  support_email TEXT NOT NULL DEFAULT 'support@lokall.com',
  support_address TEXT DEFAULT 'Hall Bazaar, Amritsar, Punjab, India',
  whatsapp_number TEXT DEFAULT '+91 98765 43210',
  facebook_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default values if not exists
INSERT INTO public.site_settings (id, support_phone, support_email, support_address, whatsapp_number)
VALUES ('default', '+91 98765 43210', 'support@lokall.com', 'Hall Bazaar, Amritsar, Punjab, India', '+91 98765 43210')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Admin Only for write, Public for read)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to site settings
DROP POLICY IF EXISTS "Allow public read access to site settings" ON public.site_settings;
CREATE POLICY "Allow public read access to site settings"
ON public.site_settings FOR SELECT
TO public
USING (true);

-- Allow admins to update site settings
DROP POLICY IF EXISTS "Allow admins to update site settings" ON public.site_settings;
CREATE POLICY "Allow admins to update site settings"
ON public.site_settings FOR UPDATE
TO authenticated
USING (true);


-- =========================================
-- FILE: update_festive_offers_enhanced.sql
-- =========================================
-- Add enhanced fields to festive_offers table
DO $$ 
BEGIN
    -- Add offer_scope column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'festive_offers' AND COLUMN_NAME = 'offer_scope') THEN
        ALTER TABLE public.festive_offers ADD COLUMN offer_scope TEXT DEFAULT 'all';
    END IF;

    -- Add min_purchase_amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'festive_offers' AND COLUMN_NAME = 'min_purchase_amount') THEN
        ALTER TABLE public.festive_offers ADD COLUMN min_purchase_amount NUMERIC(10,2);
    END IF;

    -- Add offer_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'festive_offers' AND COLUMN_NAME = 'offer_type') THEN
        ALTER TABLE public.festive_offers ADD COLUMN offer_type TEXT DEFAULT 'Discount %';
    END IF;

    -- Add product_ids column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'festive_offers' AND COLUMN_NAME = 'product_ids') THEN
        ALTER TABLE public.festive_offers ADD COLUMN product_ids UUID[] DEFAULT '{}';
    END IF;

    -- Add flat_discount_amount column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'festive_offers' AND COLUMN_NAME = 'flat_discount_amount') THEN
        ALTER TABLE public.festive_offers ADD COLUMN flat_discount_amount NUMERIC(10,2);
    END IF;
END $$;

-- Update existing records to have a default offer_scope if needed
UPDATE public.festive_offers SET offer_scope = 'all' WHERE offer_scope IS NULL;
UPDATE public.festive_offers SET offer_type = 'Discount %' WHERE offer_type IS NULL;


-- =========================================
-- FILE: recreate_search_logs_table.sql
-- =========================================
-- Recreate search_logs table with correct structure
-- WARNING: This will DROP the existing table and all its data!
-- Only run this if you're okay with losing existing data
-- Run this SQL in your Supabase SQL Editor

-- Drop existing table if it exists (THIS WILL DELETE ALL DATA!)
DROP TABLE IF EXISTS public.search_logs CASCADE;

-- Create the table with correct structure
CREATE TABLE public.search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    search_query TEXT NOT NULL,
    location_state TEXT,
    location_city TEXT,
    location_town TEXT,
    location_circle TEXT,
    results_count INTEGER DEFAULT 0,
    searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_search_logs_query ON public.search_logs(search_query);
CREATE INDEX idx_search_logs_searched_at ON public.search_logs(searched_at);
CREATE INDEX idx_search_logs_location ON public.search_logs(location_state, location_city, location_town);
CREATE INDEX idx_search_logs_location_circle ON public.search_logs(location_circle);
CREATE INDEX idx_search_logs_user_id ON public.search_logs(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations
DROP POLICY IF EXISTS "Allow all operations on search_logs" ON search_logs;
CREATE POLICY "Allow all operations on search_logs"
    ON public.search_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Verify the table was created correctly
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'search_logs'
ORDER BY ordinal_position;


-- =========================================
-- FILE: fix_search_logs_table.sql
-- =========================================
-- Fix search_logs table - Add missing columns or create table if it doesn't exist
-- Run this SQL in your Supabase SQL Editor

-- First, check if table exists and what columns it has
DO $$ 
BEGIN
    -- Check if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'search_logs'
    ) THEN
        -- Table exists, add missing columns
        
        -- Add search_query column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'search_query'
        ) THEN
            -- Check if there's a 'query' column and rename it
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'search_logs' 
                AND column_name = 'query'
            ) THEN
                ALTER TABLE public.search_logs RENAME COLUMN query TO search_query;
            ELSIF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'search_logs' 
                AND column_name = 'search_term'
            ) THEN
                ALTER TABLE public.search_logs RENAME COLUMN search_term TO search_query;
            ELSIF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'search_logs' 
                AND column_name = 'search_text'
            ) THEN
                ALTER TABLE public.search_logs RENAME COLUMN search_text TO search_query;
            ELSE
                -- Add new search_query column (allow NULL initially, then update and set NOT NULL)
                ALTER TABLE public.search_logs ADD COLUMN search_query TEXT;
                UPDATE public.search_logs SET search_query = '' WHERE search_query IS NULL;
                ALTER TABLE public.search_logs ALTER COLUMN search_query SET NOT NULL;
                ALTER TABLE public.search_logs ALTER COLUMN search_query SET DEFAULT '';
            END IF;
        END IF;
        
        -- Add user_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'user_id'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
        END IF;
        
        -- Add location_state column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'location_state'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN location_state TEXT;
        END IF;
        
        -- Add location_city column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'location_city'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN location_city TEXT;
        END IF;
        
        -- Add location_town column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'location_town'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN location_town TEXT;
        END IF;
        
        -- Add location_circle column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'location_circle'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN location_circle TEXT;
        END IF;
        
        -- Add results_count column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'results_count'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN results_count INTEGER DEFAULT 0;
        END IF;
        
        -- Add searched_at column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'searched_at'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN searched_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        -- Add id column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'id'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        END IF;
        
    ELSE
        -- Table doesn't exist, create it
        CREATE TABLE public.search_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
            search_query TEXT NOT NULL,
            location_state TEXT,
            location_city TEXT,
            location_town TEXT,
            location_circle TEXT,
            results_count INTEGER DEFAULT 0,
            searched_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON public.search_logs(search_query);
CREATE INDEX IF NOT EXISTS idx_search_logs_searched_at ON public.search_logs(searched_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_location ON public.search_logs(location_state, location_city, location_town);
CREATE INDEX IF NOT EXISTS idx_search_logs_location_circle ON public.search_logs(location_circle);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON public.search_logs(user_id);

-- Enable RLS if not already enabled
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'search_logs' 
        AND policyname = 'Allow all operations on search_logs'
    ) THEN
DROP POLICY IF EXISTS "Allow all operations on search_logs" ON search_logs;
        CREATE POLICY "Allow all operations on search_logs"
            ON public.search_logs
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'search_logs'
ORDER BY ordinal_position;


-- =========================================
-- FILE: RESTORE_ALL_MISSING_TABLES.sql
-- =========================================
-- MASTER RESTORATION SCRIPT
-- Run this in your Supabase SQL Editor to fix the 500 errors

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audience TEXT NOT NULL DEFAULT 'all', -- 'all', 'vendors', 'users'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    topic TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon_name TEXT,
    icon_url TEXT,
    image_url TEXT,
    priority INTEGER DEFAULT 999,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Master Products Table
CREATE TABLE IF NOT EXISTS public.master_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT,
    uom TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT,
    image_url TEXT,
    default_mrp NUMERIC(10,2),
    base_price NUMERIC(10,2), -- Kept for compatibility
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Import Logs Table
CREATE TABLE IF NOT EXISTS public.import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    inserted INTEGER DEFAULT 0,
    updated INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success',
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for new table
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permit_all_imports" ON public.import_logs;
CREATE POLICY "permit_all_imports" ON public.import_logs FOR ALL USING (true) WITH CHECK (true);

-- 4. Vendor Activity Logs (for Analytics)
CREATE TABLE IF NOT EXISTS public.vendor_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'price_update', 'product_added', 'profile_viewed', etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Price Flags (for Dashboard)
CREATE TABLE IF NOT EXISTS public.price_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_product_id UUID REFERENCES public.vendor_products(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    old_price NUMERIC(10,2),
    new_price NUMERIC(10,2) NOT NULL,
    market_average NUMERIC(10,2),
    flag_reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved'
    flagged_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_notifications_audience ON public.notifications(audience);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_vendor_id ON public.vendor_activity_logs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_price_flags_status ON public.price_flags(status);

-- 7. (Optional) Run the additional schema for themes if not already run
-- This covers festival_themes, payment_fees_config, etc.
-- Refer to Admin/admin-panel/supabase_schema_additional.sql


-- =========================================
-- FILE: supabase_schema_additional.sql
-- =========================================
-- Additional tables for remaining admin panel features

-- Festival Themes
CREATE TABLE IF NOT EXISTS public.festival_themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎨',
  colors JSONB NOT NULL DEFAULT '{"primary": "#E86A2C", "secondary": "#4A6CF7", "accent": "#FFD700", "background": "#FFFFFF", "text": "#1A1A1A"}'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default themes
INSERT INTO public.festival_themes (id, name, description, icon, colors, is_default, is_active) VALUES
  ('diwali', 'Diwali', 'Festival of Lights - Bright and vibrant colors', '🪔', '{"primary": "#FF6B35", "secondary": "#F7931E", "accent": "#FFD700", "background": "#FFF8E1", "text": "#1A1A1A"}'::jsonb, true, false),
  ('holi', 'Holi', 'Festival of Colors - Vibrant and playful', '🎨', '{"primary": "#FF1744", "secondary": "#E91E63", "accent": "#9C27B0", "background": "#FFF3E0", "text": "#1A1A1A"}'::jsonb, true, false),
  ('eid', 'Eid', 'Eid Celebration - Green and peaceful', '🌙', '{"primary": "#2E7D32", "secondary": "#4CAF50", "accent": "#8BC34A", "background": "#E8F5E9", "text": "#1A1A1A"}'::jsonb, true, false),
  ('christmas', 'Christmas', 'Christmas - Red, green and gold', '🎄', '{"primary": "#C62828", "secondary": "#2E7D32", "accent": "#FFD700", "background": "#FFF8E1", "text": "#1A1A1A"}'::jsonb, true, false),
  ('newYear', 'New Year', 'New Year - Blue and gold celebration', '🎊', '{"primary": "#1976D2", "secondary": "#42A5F5", "accent": "#FFD700", "background": "#E3F2FD", "text": "#1A1A1A"}'::jsonb, true, false)
ON CONFLICT (id) DO NOTHING;

-- Price Verification Settings
CREATE TABLE IF NOT EXISTS public.price_verification_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  threshold_percent NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  auto_alert_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.price_verification_settings (id, threshold_percent, auto_alert_enabled) VALUES
  ('default', 20.00, true)
ON CONFLICT (id) DO NOTHING;

-- Price Flags (flagged products)
CREATE TABLE IF NOT EXISTS public.price_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_product_id UUID REFERENCES public.vendor_products(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  old_price NUMERIC(10,2),
  new_price NUMERIC(10,2) NOT NULL,
  market_average NUMERIC(10,2),
  flag_reason TEXT NOT NULL, -- 'price_too_high' or 'price_too_low'
  status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'warned', 'hidden', 'vendor_blocked'
  flagged_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_price_flags_status ON public.price_flags(status);
CREATE INDEX IF NOT EXISTS idx_price_flags_vendor_id ON public.price_flags(vendor_id);

-- Payment & Fees Configuration
CREATE TABLE IF NOT EXISTS public.payment_fees_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 999.00,
  six_monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 4999.00,
  yearly_fee NUMERIC(10,2) NOT NULL DEFAULT 8999.00,
  grace_period_days INTEGER DEFAULT 7,
  auto_block_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.payment_fees_config (id, monthly_fee, six_monthly_fee, yearly_fee, grace_period_days, auto_block_enabled) VALUES
  ('default', 999.00, 4999.00, 8999.00, 7, true)
ON CONFLICT (id) DO NOTHING;

-- Vendor Billing
CREATE TABLE IF NOT EXISTS public.vendor_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  plan TEXT NOT NULL, -- 'monthly', 'six_monthly', 'yearly'
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'paid', 'pending', 'overdue', 'blocked'
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_billing_vendor_id ON public.vendor_billing(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_billing_status ON public.vendor_billing(status);
CREATE INDEX IF NOT EXISTS idx_vendor_billing_due_date ON public.vendor_billing(due_date);

-- Festive Offers
CREATE TABLE IF NOT EXISTS public.festive_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'vendor' or 'user'
  target TEXT NOT NULL, -- 'all', 'circle', 'specific'
  circle TEXT,
  vendor_ids UUID[], -- Array of vendor IDs if target='specific'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  discount_percent NUMERIC(5,2),
  description TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_festive_offers_status ON public.festive_offers(status);
CREATE INDEX IF NOT EXISTS idx_festive_offers_dates ON public.festive_offers(start_date, end_date);

-- E-Auctions & Online Draws
CREATE TABLE IF NOT EXISTS public.e_auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'e-auction' or 'online-draw'
  circle TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  min_bid NUMERIC(10,2), -- For e-auction only
  max_participants INTEGER,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed', 'cancelled'
  participants_count INTEGER DEFAULT 0,
  offers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_e_auctions_status ON public.e_auctions(status);
CREATE INDEX IF NOT EXISTS idx_e_auctions_dates ON public.e_auctions(start_date, end_date);

-- Search Logs (for reports)
CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  search_query TEXT NOT NULL,
  location_state TEXT,
  location_city TEXT,
  location_town TEXT,
  location_circle TEXT,
  results_count INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_query ON public.search_logs(search_query);
CREATE INDEX IF NOT EXISTS idx_search_logs_searched_at ON public.search_logs(searched_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_location ON public.search_logs(location_state, location_city, location_town);

-- Vendor Activity Logs (for reports)
CREATE TABLE IF NOT EXISTS public.vendor_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'price_update', 'product_added', 'product_updated', 'profile_viewed', 'login'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_activity_vendor_id ON public.vendor_activity_logs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_type ON public.vendor_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_created_at ON public.vendor_activity_logs(created_at);

-- Enable Row Level Security (RLS) - Admin only access
ALTER TABLE public.festival_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_verification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_fees_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.festive_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_activity_logs ENABLE ROW LEVEL SECURITY;

-- E-Auction Bids (Participants)
CREATE TABLE IF NOT EXISTS public.e_auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES public.e_auctions(id) ON DELETE CASCADE,
  bidder_name TEXT NOT NULL,
  bidder_phone TEXT,
  bidder_email TEXT,
  bid_amount NUMERIC(10,2),
  message TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'winner', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_e_auction_bids_auction_id ON public.e_auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_e_auction_bids_status ON public.e_auction_bids(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.e_auction_bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow service role to access everything)
-- Policies for public.e_auctions were already defined above.


-- =========================================
-- FILE: banners_table.sql (Added manually)
-- =========================================

CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 999,
    target_city TEXT,
    target_circle TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: RLS reading setup
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.banners;
CREATE POLICY "Enable read access for all users" ON public.banners FOR SELECT USING (true);
