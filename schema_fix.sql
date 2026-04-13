-- Add missing columns for Themes
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS selected_theme TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS selected_theme TEXT;

-- Include the other additional tables from supabase_schema_additional.sql
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

INSERT INTO public.festival_themes (id, name, description, icon, colors, is_default, is_active) VALUES
  ('diwali', 'Diwali', 'Festival of Lights - Bright and vibrant colors', '🪔', '{"primary": "#FF6B35", "secondary": "#F7931E", "accent": "#FFD700", "background": "#FFF8E1", "text": "#1A1A1A"}'::jsonb, true, false),
  ('holi', 'Holi', 'Festival of Colors - Vibrant and playful', '🎨', '{"primary": "#FF1744", "secondary": "#E91E63", "accent": "#9C27B0", "background": "#FFF3E0", "text": "#1A1A1A"}'::jsonb, true, false),
  ('eid', 'Eid', 'Eid Celebration - Green and peaceful', '🌙', '{"primary": "#2E7D32", "secondary": "#4CAF50", "accent": "#8BC34A", "background": "#E8F5E9", "text": "#1A1A1A"}'::jsonb, true, false),
  ('christmas', 'Christmas', 'Christmas - Red, green and gold', '🎄', '{"primary": "#C62828", "secondary": "#2E7D32", "accent": "#FFD700", "background": "#FFF8E1", "text": "#1A1A1A"}'::jsonb, true, false),
  ('newYear', 'New Year', 'New Year - Blue and gold celebration', '🎊', '{"primary": "#1976D2", "secondary": "#42A5F5", "accent": "#FFD700", "background": "#E3F2FD", "text": "#1A1A1A"}'::jsonb, true, false)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.price_verification_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  threshold_percent NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  auto_alert_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.price_verification_settings (id, threshold_percent, auto_alert_enabled) VALUES
  ('default', 20.00, true)
ON CONFLICT (id) DO NOTHING;

-- Banners Table
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

-- Enable RLS and public read access for banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.banners;
CREATE POLICY "Enable read access for all users" ON public.banners FOR SELECT USING (true);
