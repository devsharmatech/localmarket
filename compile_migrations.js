const fs = require('fs');
const path = require('path');
const dir = 'c:/Nextjs/localmarket-main/Admin/admin-panel/sql';

const filesToInclude = [
  'create_users_table.sql',
  'ensure_vendor_products_table.sql',
  // 'create_categories_table.sql', // might not exist
  'create_enquiries_table.sql',
  'create_festive_offers_table.sql',
  'create_locations_table.sql',
  'create_payment_fees_config_table.sql',
  'create_reviews_table.sql',
  'create_search_logs_table.sql',
  'add_banner_location_columns.sql',
  'add_category_icon_url.sql',
  'add_category_image_url.sql',
  'add_description_to_vendor_products.sql',
  'add_featured_flags.sql',
  'add_image_url_to_festive_offers.sql',
  'add_kyc_columns.sql',
  'add_location_to_vendors.sql',
  'add_password_to_users.sql',
  'add_subscription_banner_columns.sql',
  'add_theme_to_users.sql',
  'add_vendor_columns.sql',
  'add_vendor_image_columns.sql',
  'market_comparison_logic.sql',
  'site_settings.sql',
  'update_festive_offers_enhanced.sql',
  'recreate_search_logs_table.sql',
  'fix_search_logs_table.sql',
  'RESTORE_ALL_MISSING_TABLES.sql'
];

let out = '-- ========================================================\n';
out += '-- MASTER LOCALMARKET SUPABASE RESTORATION SCRIPT\n';
out += '-- Compiles ALL schema files for safe recreation on Hostinger\n';
out += '-- ========================================================\n\n';

for (const f of filesToInclude) {
    const fullPath = path.join(dir, f);
    if (fs.existsSync(fullPath)) {
        out += '-- =========================================\n';
        out += '-- FILE: ' + f + '\n';
        out += '-- =========================================\n';
        out += fs.readFileSync(fullPath, 'utf8') + '\n\n';
    } else {
        console.log('Skipping missing file:', f);
    }
}

const additional = 'c:/Nextjs/localmarket-main/Admin/admin-panel/supabase_schema_additional.sql';
if (fs.existsSync(additional)) {
    out += '-- =========================================\n';
    out += '-- FILE: supabase_schema_additional.sql\n';
    out += '-- =========================================\n';
    out += fs.readFileSync(additional, 'utf8') + '\n\n';
}

out += '-- =========================================\n';
out += '-- FILE: banners_table.sql (Added manually)\n';
out += '-- =========================================\n';
out += `
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 999,
    target_city TEXT,
    target_circle TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: RLS reading setup
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.banners;
CREATE POLICY "Enable read access for all users" ON public.banners FOR SELECT USING (true);
`;

fs.writeFileSync('c:/Nextjs/localmarket-main/COMPLETE_MIGRATION.sql', out);
console.log('Successfully compiled COMPLETE_MIGRATION.sql. Size:', out.length);
