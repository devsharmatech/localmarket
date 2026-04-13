-- Add subscription banner columns to payment_fees_config table
-- Run this in Supabase SQL Editor

ALTER TABLE payment_fees_config
  ADD COLUMN IF NOT EXISTS banner_enabled  BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS banner_badge    TEXT    DEFAULT '🚀 Registration Offer',
  ADD COLUMN IF NOT EXISTS banner_title    TEXT    DEFAULT 'Activate Your Vendor Account',
  ADD COLUMN IF NOT EXISTS banner_subtitle TEXT    DEFAULT 'Choose a subscription plan to start selling on Local Market and reach thousands of customers in your area.',
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT   DEFAULT NULL;

-- Ensure a default row exists
INSERT INTO payment_fees_config (id, monthly_fee, six_monthly_fee, yearly_fee, grace_period_days, auto_block_enabled, banner_enabled, banner_badge, banner_title, banner_subtitle, banner_image_url)
VALUES (
  'default',
  999,
  4999,
  8999,
  7,
  true,
  true,
  '🚀 Registration Offer',
  'Activate Your Vendor Account',
  'Choose a subscription plan to start selling on Local Market and reach thousands of customers in your area.',
  NULL
)
ON CONFLICT (id) DO NOTHING;
