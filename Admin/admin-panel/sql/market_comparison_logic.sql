-- LOKALL Market Comparison Logic
-- Implements the "% Lower Price" comparison as described in the documentation.
-- Scalable for lakhs of products.

-- 1. Create a View to calculate average prices per product in each circle
CREATE OR REPLACE VIEW public.circle_product_averages AS
SELECT 
    v.city,
    v.circle,
    p.name as product_name,
    AVG(p.price) as avg_price,
    COUNT(*) as vendor_count
FROM 
    public.vendor_products p
JOIN 
    public.vendors v ON p.vendor_id = v.id
WHERE 
    p.is_active = true 
    AND v.status = 'Active'
    AND v.city IS NOT NULL 
    AND v.circle IS NOT NULL
GROUP BY 
    v.city, v.circle, p.name;

-- 2. Create the Market Comparison Stats View
-- This compares each circle's prices against all OTHER circles in the same city for the SAME products.
CREATE OR REPLACE VIEW public.market_comparison_stats AS
WITH other_circles_avg AS (
    -- For each product in a circle, find the average price in ALL OTHER circles of the same city
    SELECT 
        a.city,
        a.circle,
        a.product_name,
        a.avg_price as this_circle_price,
        AVG(b.avg_price) as other_circles_price
    FROM 
        public.circle_product_averages a
    JOIN 
        public.circle_product_averages b ON a.product_name = b.product_name 
                                        AND a.city = b.city 
                                        AND a.circle != b.circle
    GROUP BY 
        a.city, a.circle, a.product_name, a.avg_price
),
circle_savings AS (
    -- Aggregate the savings across all common products for each circle
    SELECT 
        city,
        circle,
        AVG(other_circles_price) as city_avg_on_common,
        AVG(this_circle_price) as circle_avg_on_common,
        COUNT(*) as common_products_count
    FROM 
        other_circles_avg
    GROUP BY 
        city, circle
)
SELECT 
    city,
    circle,
    common_products_count,
    ROUND(circle_avg_on_common, 2) as avg_price_here,
    ROUND(city_avg_on_common, 2) as avg_price_elsewhere,
    -- Formula: ((OtherAvg - ThisAvg) / OtherAvg) * 100
    CASE 
        WHEN city_avg_on_common > 0 THEN 
            ROUND(((city_avg_on_common - circle_avg_on_common) / city_avg_on_common) * 100, 1)
        ELSE 0 
    END as lower_price_pct
FROM 
    circle_savings;

-- 3. Comments and helper indexes (ensure performance)
COMMENT ON VIEW public.market_comparison_stats IS 'Calculates the percentage price advantage for each market (circle) compared to others in the same city.';

-- Ensure indexes exist for the join performance
CREATE INDEX IF NOT EXISTS idx_vendor_products_active_name ON public.vendor_products(is_active, name);
CREATE INDEX IF NOT EXISTS idx_vendors_city_circle_status ON public.vendors(city, circle, status);
