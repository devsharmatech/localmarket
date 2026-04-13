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
