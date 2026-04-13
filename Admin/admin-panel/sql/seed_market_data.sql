-- Expanded seeding script for Amritsar, Noida, and Greater Noida Market Data
-- This script adds many more market locations for testing

-- 1. Insert Locations for Amritsar
INSERT INTO public.locations (state, city, town, tehsil, sub_tehsil, circle) VALUES
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Hall Bazaar'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Lawrence Road'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Putligarh Market'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Katra Jaimal Singh'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Novelty Chowk'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Ranjit Avenue'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Guru Bazaar'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Shastri Market'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Lahori Gate Market'),
('Punjab', 'Amritsar', 'Amritsar', 'Amritsar', 'Amritsar', 'Cooper Road')
ON CONFLICT (state, city, town, tehsil, sub_tehsil) DO NOTHING;

-- 2. Insert Locations for Noida
INSERT INTO public.locations (state, city, town, tehsil, sub_tehsil, circle) VALUES
('Uttar Pradesh', 'Noida', 'Noida', 'Dadri', 'Noida', 'Atta Market'),
('Uttar Pradesh', 'Noida', 'Noida', 'Dadri', 'Noida', 'Brahmaputra Market'),
('Uttar Pradesh', 'Noida', 'Noida', 'Dadri', 'Noida', 'Indira Market'),
('Uttar Pradesh', 'Noida', 'Noida', 'Dadri', 'Noida', 'Sector 18 Market'),
('Uttar Pradesh', 'Noida', 'Noida', 'Dadri', 'Noida', 'Sector 62 Market'),
('Uttar Pradesh', 'Noida', 'Noida', 'Dadri', 'Noida', 'Sector 110 Market')
ON CONFLICT (state, city, town, tehsil, sub_tehsil) DO NOTHING;

-- 3. Insert Locations for Greater Noida
INSERT INTO public.locations (state, city, town, tehsil, sub_tehsil, circle) VALUES
('Uttar Pradesh', 'Greater Noida', 'Greater Noida', 'Dadri', 'Greater Noida', 'Jaguar Market'),
('Uttar Pradesh', 'Greater Noida', 'Greater Noida', 'Dadri', 'Greater Noida', 'Alpha 1 Market'),
('Uttar Pradesh', 'Greater Noida', 'Greater Noida', 'Dadri', 'Greater Noida', 'Beta 2 Market'),
('Uttar Pradesh', 'Greater Noida', 'Greater Noida', 'Dadri', 'Greater Noida', 'Grand Venice Area'),
('Uttar Pradesh', 'Greater Noida', 'Greater Noida', 'Dadri', 'Greater Noida', 'Jagat Farm'),
('Uttar Pradesh', 'Greater Noida', 'Greater Noida', 'Dadri', 'Greater Noida', 'Pari Chowk Area'),
('Uttar Pradesh', 'Greater Noida', 'Greater Noida', 'Dadri', 'Greater Noida', 'Tugalpur Market'),
('Uttar Pradesh', 'Greater Noida', 'Greater Noida', 'Dadri', 'Greater Noida', 'Omaxe Mall Area')
ON CONFLICT (state, city, town, tehsil, sub_tehsil) DO NOTHING;
