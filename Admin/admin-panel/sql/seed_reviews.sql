-- Seeding script for sample reviews
-- This script adds reviews to test the "Review from DB" feature

DO $$
DECLARE
    v1_id UUID;
    v2_id UUID;
    v3_id UUID;
BEGIN
    -- Get vendor IDs from our previous seed (or any active vendors)
    SELECT id INTO v1_id FROM public.vendors WHERE name = 'Amritsar Fresh Mart' LIMIT 1;
    SELECT id INTO v2_id FROM public.vendors WHERE name = 'Golden Electronics' LIMIT 1;
    SELECT id INTO v3_id FROM public.vendors WHERE name = 'Noida Fashion Hub' LIMIT 1;

    -- Reviews for Amritsar Fresh Mart (v1)
    IF v1_id IS NOT NULL THEN
        INSERT INTO public.reviews (vendor_id, user_name, rating, comment, created_at) VALUES
        (v1_id::TEXT, 'Vansh Kapoor', 5, 'Best quality basmati rice in the market! The delivery was very quick.', NOW() - INTERVAL '2 days'),
        (v1_id::TEXT, 'Priya Sharma', 4, 'Everything is fresh, but the shop was a bit crowded.', NOW() - INTERVAL '5 days');
    END IF;

    -- Reviews for Golden Electronics (v2)
    IF v2_id IS NOT NULL THEN
        INSERT INTO public.reviews (vendor_id, user_name, rating, comment, reply, created_at) VALUES
        (v2_id::TEXT, 'Amit Malhotra', 5, 'Highly recommended for mobile accessories. Original products only.', 'Thank you Amit! We value your trust.', NOW() - INTERVAL '1 day'),
        (v2_id::TEXT, 'Suresh Kumar', 3, 'Pricing is okay, but service could be slightly faster.', 'We are working on improving our turnaround time, Suresh.', NOW() - INTERVAL '10 days');
    END IF;

    -- Reviews for Noida Fashion Hub (v3)
    IF v3_id IS NOT NULL THEN
        INSERT INTO public.reviews (vendor_id, user_name, rating, comment, created_at) VALUES
        (v3_id::TEXT, 'Anjali Verma', 5, 'Great collection of cotton sarees. Very reasonable prices.', NOW() - INTERVAL '3 days');
    END IF;

END $$;
