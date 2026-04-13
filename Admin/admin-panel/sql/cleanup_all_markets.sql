-- Cleanup ALL markets/circles from locations
DELETE FROM public.locations WHERE circle IS NOT NULL;

-- Optional: Clear circle name from vendors (resets their assignment)
UPDATE public.vendors SET circle = NULL;
