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
