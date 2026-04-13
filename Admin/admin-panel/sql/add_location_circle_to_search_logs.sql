-- Add location_circle column to search_logs table if it doesn't exist
-- Run this SQL in your Supabase SQL Editor

-- Add location_circle column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'search_logs' 
        AND column_name = 'location_circle'
    ) THEN
        ALTER TABLE public.search_logs 
        ADD COLUMN location_circle TEXT;
        
        COMMENT ON COLUMN public.search_logs.location_circle IS 'Circle location where the search was performed';
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_search_logs_location_circle ON public.search_logs(location_circle);
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'search_logs'
AND column_name IN ('location_circle', 'location_state', 'location_city', 'location_town')
ORDER BY ordinal_position;
