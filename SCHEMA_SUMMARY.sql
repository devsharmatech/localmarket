ALTER TABLE public.banners 
        ADD COLUMN target_city TEXT;

ALTER TABLE public.banners 
        ADD COLUMN target_circle TEXT;

ALTER TABLE public.categories 
        ADD COLUMN icon_url TEXT;

ALTER TABLE public.categories 
        ADD COLUMN image_url TEXT;

ALTER TABLE public.vendor_products 
        ADD COLUMN description TEXT;

ALTER TABLE public.vendors 
        ADD COLUMN is_verified BOOLEAN DEFAULT false;

ALTER TABLE public.vendors 
        ADD COLUMN is_featured BOOLEAN DEFAULT false;

ALTER TABLE public.vendor_products 
        ADD COLUMN is_featured BOOLEAN DEFAULT false;

ALTER TABLE public.vendor_products 
        ADD COLUMN is_price_drop BOOLEAN DEFAULT false;

ALTER TABLE public.vendor_products 
        ADD COLUMN is_mega_saving BOOLEAN DEFAULT false;

ALTER TABLE public.vendor_products 
        ADD COLUMN online_price NUMERIC(10,2);

ALTER TABLE public.festive_offers ADD COLUMN image_url TEXT;

ALTER TABLE public.festive_offers ADD COLUMN vendor_name TEXT;

ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS id_proof_url TEXT,
ADD COLUMN IF NOT EXISTS shop_proof_url TEXT,
ADD COLUMN IF NOT EXISTS id_proof_type TEXT,
ADD COLUMN IF NOT EXISTS shop_proof_type TEXT,
ADD COLUMN IF NOT EXISTS owner_photo_url TEXT,
ADD COLUMN IF NOT EXISTS inside_shop_photo_url TEXT;

ALTER TABLE public.search_logs 
        ADD COLUMN location_circle TEXT;

ALTER TABLE public.vendors 
        ADD COLUMN latitude FLOAT8;

ALTER TABLE public.vendors 
        ADD COLUMN longitude FLOAT8;

ALTER TABLE public.users 
        ADD COLUMN password TEXT;

ALTER TABLE public.users 
        ADD COLUMN otp TEXT;

ALTER TABLE public.users 
        ADD COLUMN otp_expires_at TIMESTAMPTZ;

ALTER TABLE payment_fees_config
  ADD COLUMN IF NOT EXISTS banner_enabled  BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS banner_badge    TEXT    DEFAULT 'ðŸš€ Registration Offer',
  ADD COLUMN IF NOT EXISTS banner_title    TEXT    DEFAULT 'Activate Your Vendor Account',
  ADD COLUMN IF NOT EXISTS banner_subtitle TEXT    DEFAULT 'Choose a subscription plan to start selling on Local Market and reach thousands of customers in your area.',
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT   DEFAULT NULL;

ALTER TABLE public.users 
    ADD COLUMN selected_theme TEXT DEFAULT 'default';

ALTER TABLE public.vendors 
        ADD COLUMN category TEXT;

ALTER TABLE public.vendors 
        ADD COLUMN owner TEXT;

ALTER TABLE public.vendors 
        ADD COLUMN owner_name TEXT;

ALTER TABLE public.vendors 
        ADD COLUMN image_url TEXT;

ALTER TABLE public.vendors 
        ADD COLUMN shop_front_photo_url TEXT;

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

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.festive_offers ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.payment_fees_config ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.vendor_products 
        ADD COLUMN is_active BOOLEAN DEFAULT true;

ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

create table if it doesn't exist
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

ALTER TABLE public.search_logs RENAME COLUMN search_term TO search_query;

ALTER TABLE public.search_logs RENAME COLUMN search_text TO search_query;

ALTER TABLE public.search_logs ADD COLUMN search_query TEXT;

ALTER TABLE public.search_logs ALTER COLUMN search_query SET NOT NULL;

ALTER TABLE public.search_logs ALTER COLUMN search_query SET DEFAULT '';

ALTER TABLE public.search_logs 
            ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.search_logs 
            ADD COLUMN location_state TEXT;

ALTER TABLE public.search_logs 
            ADD COLUMN location_city TEXT;

ALTER TABLE public.search_logs 
            ADD COLUMN location_town TEXT;

ALTER TABLE public.search_logs 
            ADD COLUMN location_circle TEXT;

ALTER TABLE public.search_logs 
            ADD COLUMN results_count INTEGER DEFAULT 0;

ALTER TABLE public.search_logs 
            ADD COLUMN searched_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.search_logs 
            ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();

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

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audience TEXT NOT NULL DEFAULT 'all', -- 'all', 'vendors', 'users'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    topic TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.master_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT,
    image_url TEXT,
    base_price NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vendor_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'price_update', 'product_added', 'profile_viewed', etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.festive_offers ADD COLUMN offer_scope TEXT DEFAULT 'all';

ALTER TABLE public.festive_offers ADD COLUMN min_purchase_amount NUMERIC(10,2);

ALTER TABLE public.festive_offers ADD COLUMN offer_type TEXT DEFAULT 'Discount %';

ALTER TABLE public.festive_offers ADD COLUMN product_ids UUID[] DEFAULT '{}';

ALTER TABLE public.festive_offers ADD COLUMN flat_discount_amount NUMERIC(10,2);