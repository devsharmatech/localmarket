-- Fix search_logs table - Add missing columns or create table if it doesn't exist
-- Run this SQL in your Supabase SQL Editor

-- First, check if table exists and what columns it has
DO $$ 
BEGIN
    -- Check if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'search_logs'
    ) THEN
        -- Table exists, add missing columns
        
        -- Add search_query column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'search_query'
        ) THEN
            -- Check if there's a 'query' column and rename it
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'search_logs' 
                AND column_name = 'query'
            ) THEN
                ALTER TABLE public.search_logs RENAME COLUMN query TO search_query;
            ELSIF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'search_logs' 
                AND column_name = 'search_term'
            ) THEN
                ALTER TABLE public.search_logs RENAME COLUMN search_term TO search_query;
            ELSIF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'search_logs' 
                AND column_name = 'search_text'
            ) THEN
                ALTER TABLE public.search_logs RENAME COLUMN search_text TO search_query;
            ELSE
                -- Add new search_query column (allow NULL initially, then update and set NOT NULL)
                ALTER TABLE public.search_logs ADD COLUMN search_query TEXT;
                UPDATE public.search_logs SET search_query = '' WHERE search_query IS NULL;
                ALTER TABLE public.search_logs ALTER COLUMN search_query SET NOT NULL;
                ALTER TABLE public.search_logs ALTER COLUMN search_query SET DEFAULT '';
            END IF;
        END IF;
        
        -- Add user_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'user_id'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
        END IF;
        
        -- Add location_state column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'location_state'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN location_state TEXT;
        END IF;
        
        -- Add location_city column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'location_city'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN location_city TEXT;
        END IF;
        
        -- Add location_town column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'location_town'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN location_town TEXT;
        END IF;
        
        -- Add location_circle column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'location_circle'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN location_circle TEXT;
        END IF;
        
        -- Add results_count column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'results_count'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN results_count INTEGER DEFAULT 0;
        END IF;
        
        -- Add searched_at column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'searched_at'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN searched_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        -- Add id column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'search_logs' 
            AND column_name = 'id'
        ) THEN
            ALTER TABLE public.search_logs 
            ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
        END IF;
        
    ELSE
        -- Table doesn't exist, create it
        CREATE TABLE public.search_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
            search_query TEXT NOT NULL,
            location_state TEXT,
            location_city TEXT,
            location_town TEXT,
            location_circle TEXT,
            results_count INTEGER DEFAULT 0,
            searched_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON public.search_logs(search_query);
CREATE INDEX IF NOT EXISTS idx_search_logs_searched_at ON public.search_logs(searched_at);
CREATE INDEX IF NOT EXISTS idx_search_logs_location ON public.search_logs(location_state, location_city, location_town);
CREATE INDEX IF NOT EXISTS idx_search_logs_location_circle ON public.search_logs(location_circle);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON public.search_logs(user_id);

-- Enable RLS if not already enabled
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'search_logs' 
        AND policyname = 'Allow all operations on search_logs'
    ) THEN
        CREATE POLICY "Allow all operations on search_logs"
            ON public.search_logs
            FOR ALL
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'search_logs'
ORDER BY ordinal_position;
