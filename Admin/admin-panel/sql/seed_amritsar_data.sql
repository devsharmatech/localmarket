-- seed_amritsar_data.sql
-- Population script to bring Amritsar home page to life with real-world data

DO $$ 
DECLARE
    amritsar_id UUID;
    electronics_cat_id UUID;
    grocery_cat_id UUID;
    fashion_cat_id UUID;
    sweets_cat_id UUID;
    vendor_1_id UUID;
    vendor_2_id UUID;
    vendor_3_id UUID;
    vendor_4_id UUID;
BEGIN
    -- 1. Ensure Amritsar Locations exist (Punjab > Amritsar)
    INSERT INTO public.locations (state, city, town, tehsil, sub_tehsil, circle)
    VALUES 
        ('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Golden Temple'),
        ('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Lawrence Road'),
        ('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Ranjit Avenue')
    ON CONFLICT (state, city, town, tehsil, sub_tehsil, COALESCE(circle, '')) DO NOTHING;

    -- 2. Get some basic Categories (or create if missing)
    -- We assume standard categories exist, if not we find them by name
    SELECT id INTO electronics_cat_id FROM public.categories WHERE name ILIKE '%Electronic%' LIMIT 1;
    SELECT id INTO grocery_cat_id FROM public.categories WHERE name ILIKE '%Grocer%' OR name ILIKE '%Food%' LIMIT 1;
    SELECT id INTO fashion_cat_id FROM public.categories WHERE name ILIKE '%Fashion%' OR name ILIKE '%Cloth%' LIMIT 1;
    SELECT id INTO sweets_cat_id FROM public.categories WHERE name ILIKE '%Sweet%' OR name ILIKE '%Bakery%' LIMIT 1;

    -- 3. Create Amritsar Vendors (Elite Shops)
    -- Shop 1: Amritsar Electronics (Ranjit Avenue)
    INSERT INTO public.vendors (
        name, owner, email, contact_number, status, kyc_status, category, 
        state, city, town, tehsil, sub_tehsil, circle, 
        is_verified, is_featured, latitude, longitude
    ) VALUES (
        'Amritsar Electronics Hub', 'Rajesh Kumar', 'sales@amritsarelectronics.com', '9876543210', 'Active', 'Verified', 'Electronics',
        'Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Ranjit Avenue',
        true, true, 31.6340, 74.8723
    ) RETURNING id INTO vendor_1_id;

    -- Shop 2: Suri Premium Sweets (Lawrence Road)
    INSERT INTO public.vendors (
        name, owner, email, contact_number, status, kyc_status, category, 
        state, city, town, tehsil, sub_tehsil, circle, 
        is_verified, is_featured, latitude, longitude
    ) VALUES (
        'Suri Premium Sweets', 'Amit Suri', 'orders@surisweets.com', '9876543211', 'Active', 'Verified', 'Sweets & Bakery',
        'Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Lawrence Road',
        true, true, 31.6425, 74.8780
    ) RETURNING id INTO vendor_2_id;

    -- Shop 3: Golden Silk Emporium (Golden Temple Area)
    INSERT INTO public.vendors (
        name, owner, email, contact_number, status, kyc_status, category, 
        state, city, town, tehsil, sub_tehsil, circle, 
        is_verified, is_featured, latitude, longitude
    ) VALUES (
        'Golden Silk Emporium', 'Harpreet Singh', 'contact@goldensilk.com', '9876543212', 'Active', 'Verified', 'Fashion',
        'Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Golden Temple',
        true, true, 31.6200, 74.8765
    ) RETURNING id INTO vendor_3_id;

    -- Shop 4: Khalsa Organic Store (Crystal Chowk)
    INSERT INTO public.vendors (
        name, owner, email, contact_number, status, kyc_status, category, 
        state, city, town, tehsil, sub_tehsil, circle, 
        is_verified, is_featured, latitude, longitude
    ) VALUES (
        'Khalsa Organic Store', 'Gurmeet Singh', 'hello@khalsaorganic.com', '9876543213', 'Active', 'Verified', 'Groceries',
        'Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Lawrence Road',
        true, true, 31.6400, 74.8750
    ) RETURNING id INTO vendor_4_id;

    -- 4. Add Trending Products with Featured Flags

    -- Vendor 1 (Electronics) Products
    INSERT INTO public.vendor_products (vendor_id, name, price, mrp, online_price, is_active, is_featured, is_price_drop, is_mega_saving, category_id)
    VALUES 
        (vendor_1_id, 'Samsung 55" QLED TV (2024)', 52000, 75000, 58000, true, true, true, true, electronics_cat_id),
        (vendor_1_id, 'MacBook Air M2 13"', 84900, 99900, 89000, true, true, true, true, electronics_cat_id),
        (vendor_1_id, 'Sony WH-1000XM5 ANC', 24900, 32000, 26900, true, false, true, true, electronics_cat_id);

    -- Vendor 2 (Sweets) Products
    INSERT INTO public.vendor_products (vendor_id, name, price, mrp, online_price, is_active, is_featured, is_price_drop, is_mega_saving, category_id)
    VALUES 
        (vendor_2_id, 'Golden Dry Fruit Box (1kg)', 1250, 1800, 1500, true, true, true, true, sweets_cat_id),
        (vendor_2_id, 'Amritsari Pinni Special', 650, 800, 750, true, true, true, true, sweets_cat_id);

    -- Vendor 3 (Fashion) Products
    INSERT INTO public.vendor_products (vendor_id, name, price, mrp, online_price, is_active, is_featured, is_price_drop, is_mega_saving, category_id)
    VALUES 
        (vendor_3_id, 'Phulkari Hand-Embroidered Suit', 4500, 6500, 5500, true, true, true, true, fashion_cat_id),
        (vendor_3_id, 'Bridal Banarasi Lehnga', 12000, 18000, 15000, true, true, true, true, fashion_cat_id);

    -- Vendor 4 (Grocery) Products
    INSERT INTO public.vendor_products (vendor_id, name, price, mrp, online_price, is_active, is_featured, is_price_drop, is_mega_saving, category_id)
    VALUES 
        (vendor_4_id, 'Desi Ghee (Pure A2 - 1L)', 850, 1100, 950, true, true, true, true, grocery_cat_id),
        (vendor_4_id, 'Premium Basmati Rice (5kg)', 750, 950, 850, true, true, true, true, grocery_cat_id);

END $$;
