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
