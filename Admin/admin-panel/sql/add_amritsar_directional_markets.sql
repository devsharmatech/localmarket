-- Add 5 direction-based markets for Amritsar
INSERT INTO public.locations (state, city, town, tehsil, sub_tehsil, circle, market_icon) VALUES
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Central Market', '🏛️'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'East Market', '🏘️'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'North Market', '🏢'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'South Market', '🏬'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'West Market', '🏙️')
ON CONFLICT (state, city, town, tehsil, sub_tehsil, circle) DO NOTHING;
