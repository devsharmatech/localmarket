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
