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
    icon_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Master Products Table
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
