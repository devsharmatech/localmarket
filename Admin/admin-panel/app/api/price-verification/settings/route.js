import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestUpsert } from '@/lib/supabaseAdminFetch';

// GET /api/price-verification/settings - Get settings
export async function GET() {
  try {
    const settings = await supabaseRestGet('/rest/v1/price_verification_settings?id=eq.default&select=*');
    return NextResponse.json(settings[0] || { threshold_percent: 20, auto_alert_enabled: true });
  } catch (error) {
    console.error('Error fetching price verification settings:', error);
    if (error.message && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND'))) {
      return NextResponse.json({ threshold_percent: 20, auto_alert_enabled: true, warning: 'offline_mode' }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/price-verification/settings - Update settings
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { threshold_percent, auto_alert_enabled } = body;

    const settings = {
      id: 'default',
      threshold_percent: threshold_percent !== undefined ? parseFloat(threshold_percent) : undefined,
      auto_alert_enabled: auto_alert_enabled !== undefined ? auto_alert_enabled : undefined,
    };

    // supabaseRestUpsert expects an array
    const result = await supabaseRestUpsert('/rest/v1/price_verification_settings', [settings]);
    const finalResult = Array.isArray(result) ? result[0] : result;
    return NextResponse.json(finalResult || settings);
  } catch (error) {
    console.error('Error updating price verification settings:', error);
    let errorMessage = error.message || 'Failed to update settings';

    // Provide helpful error message if table doesn't exist
    if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('PGRST205')) {
      errorMessage = 'The price_verification_settings table does not exist in Supabase. Please run the SQL script: supabase_schema_additional.sql';
    }

    if (errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND')) {
      return NextResponse.json({ success: false, warning: 'Sync failed: Database unreachable' });
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
