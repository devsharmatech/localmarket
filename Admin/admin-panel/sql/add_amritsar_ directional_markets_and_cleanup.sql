-- 1. Add 5 requested directional markets for Amritsar
INSERT INTO public.locations (state, city, town, tehsil, sub_tehsil, circle, market_icon) VALUES
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Central Market', '🏛️'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'East Market', '🏘️'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'North Market', '🏢'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'South Market', '🏬'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'West Market', '🏙️')
ON CONFLICT (state, city, town, tehsil, sub_tehsil, circle) DO NOTHING;

-- 2. Cleanup: Remove duplicate or incorrectly structured Amritsar entries 
-- (User noted "Amritsar City > Amritsar City" added multiple times)
-- This is a safe cleanup targeting specifically problematic hierarchies identified by the user.
DELETE FROM public.locations 
WHERE state = 'Punjab' 
  AND city = 'Amritsar' 
  AND (
    (town = 'Amritsar City' AND tehsil = 'Amritsar City' AND circle IS NULL) OR
    (tehsil IN ('Golden Temple Area', 'Ranjit Avenue') AND circle IS NULL)
  );
