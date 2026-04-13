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
