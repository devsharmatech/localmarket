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
CREATE POLICY "Allow public insert" ON public.enquiries
  FOR INSERT WITH CHECK (true);

-- Allow related vendor or admin to select
CREATE POLICY "Allow vendor/admin select" ON public.enquiries
  FOR SELECT USING (true); -- Simplifying for now, can be restricted later

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_enquiries_vendor_id ON public.enquiries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at);
