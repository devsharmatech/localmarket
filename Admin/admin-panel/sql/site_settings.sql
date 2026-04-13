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
CREATE POLICY IF NOT EXISTS "Allow public read access to site settings"
ON public.site_settings FOR SELECT
TO public
USING (true);

-- Allow admins to update site settings
CREATE POLICY IF NOT EXISTS "Allow admins to update site settings"
ON public.site_settings FOR UPDATE
TO authenticated
USING (true);
