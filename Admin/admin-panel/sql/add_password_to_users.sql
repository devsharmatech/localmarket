-- Add password column to users table for email login
-- Run this SQL in your Supabase SQL Editor

-- Add password column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'password'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN password TEXT;
        
        COMMENT ON COLUMN public.users.password IS 'Hashed password for email login (optional, only for email-based accounts)';
    END IF;
END $$;

-- Add OTP columns for SMS login
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'otp'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN otp TEXT;
        
        COMMENT ON COLUMN public.users.otp IS 'Temporary OTP for SMS login verification';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'otp_expires_at'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN otp_expires_at TIMESTAMPTZ;
        
        COMMENT ON COLUMN public.users.otp_expires_at IS 'OTP expiration timestamp';
    END IF;
END $$;

-- Verify columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN ('password', 'otp', 'otp_expires_at')
ORDER BY ordinal_position;
