import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestUpsert } from '@/lib/supabaseAdminFetch';

// GET /api/payment-fees/config - Get configuration
export async function GET() {
  console.log('[API] GET /api/payment-fees/config - Starting request');
  try {
    const config = await supabaseRestGet('/rest/v1/payment_fees_config?id=eq.default&select=*');
    const configData = Array.isArray(config) ? config[0] : config;
    
    if (!configData) {
      console.warn('[API] GET /api/payment-fees/config - No config found in DB, returning defaults');
    } else {
      console.log('[API] GET /api/payment-fees/config - Success');
    }

    return NextResponse.json(configData || {
      monthly_fee: 50,
      six_monthly_fee: 299,
      yearly_fee: 599,
      grace_period_days: 7,
      auto_block_enabled: true,
      banner_enabled: true,
      banner_badge: '🚀 Registration Offer',
      banner_title: 'Activate Your Vendor Account',
      banner_subtitle: 'Choose a subscription plan to start selling on Local Market and reach thousands of customers in your area.',
      banner_image_url: '',
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    
    console.error('[API] GET /api/payment-fees/config - Failed:', {
      message: errorMsg,
      stack: errorStack
    });

    const isOffline = errorMsg.includes('fetch failed') || errorMsg.includes('ENOTFOUND');
    
    return NextResponse.json({
      monthly_fee: 50,
      six_monthly_fee: 299,
      yearly_fee: 599,
      grace_period_days: 7,
      auto_block_enabled: true,
      banner_enabled: true,
      banner_badge: '🚀 Registration Offer',
      banner_title: 'Activate Your Vendor Account',
      banner_subtitle: 'Choose a subscription plan to start selling on Local Market and reach thousands of customers in your area.',
      banner_image_url: '',
      warning: isOffline ? 'offline_mode' : 'fetch_error',
      debug_error: errorMsg
    });
  }
}

// PATCH /api/payment-fees/config - Update configuration
export async function PATCH(request) {
  try {
    const body = await request.json();
    const {
      monthly_fee,
      six_monthly_fee,
      yearly_fee,
      grace_period_days,
      auto_block_enabled,
      banner_enabled,
      banner_badge,
      banner_title,
      banner_subtitle,
      banner_image_url,
    } = body;

    const config = {
      id: 'default',
      ...(monthly_fee !== undefined && { monthly_fee: parseFloat(monthly_fee) }),
      ...(six_monthly_fee !== undefined && { six_monthly_fee: parseFloat(six_monthly_fee) }),
      ...(yearly_fee !== undefined && { yearly_fee: parseFloat(yearly_fee) }),
      ...(grace_period_days !== undefined && { grace_period_days: parseInt(grace_period_days) }),
      ...(auto_block_enabled !== undefined && { auto_block_enabled: Boolean(auto_block_enabled) }),
      ...(banner_enabled !== undefined && { banner_enabled: Boolean(banner_enabled) }),
      ...(banner_badge !== undefined && { banner_badge: String(banner_badge) }),
      ...(banner_title !== undefined && { banner_title: String(banner_title) }),
      ...(banner_subtitle !== undefined && { banner_subtitle: String(banner_subtitle) }),
      ...(banner_image_url !== undefined && { banner_image_url: banner_image_url ? String(banner_image_url) : null }),
    };

    let result = null;
    let success = false;

    // Step 1: Attempt Upsert
    try {
      result = await supabaseRestUpsert('/rest/v1/payment_fees_config', [config]);
      success = true;
    } catch (upsertError) {
      console.error('Upsert failed, will attempt fallback insert:', upsertError.message);
    }

    // Step 2: Fallback to Insert if Upsert failed
    if (!success) {
      try {
        const { supabaseRestInsert } = await import('../../../../lib/supabaseAdminFetch');
        result = await supabaseRestInsert('/rest/v1/payment_fees_config', [config]);
        success = true;
      } catch (insertError) {
        console.error('Insert fallback failed:', insertError.message);
        throw new Error(`Failed to save configuration: ${insertError.message}. Did you run the SQL migration?`);
      }
    }

    const finalResult = Array.isArray(result) ? result[0] : result;
    console.log('[API] PATCH /api/payment-fees/config - Success');
    return NextResponse.json(finalResult || config);

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';

    console.error('[API] PATCH /api/payment-fees/config - Failed:', {
      message: errorMsg,
      stack: errorStack
    });
    
    const isNetworkError = errorMsg.includes('fetch failed') || errorMsg.includes('ENOTFOUND');

    if (isNetworkError) {
      return NextResponse.json({ 
        success: false, 
        warning: 'Sync failed: Database unreachable' 
      }, { status: 503 });
    }
    
    return NextResponse.json({
      error: errorMsg,
      debug_stack: errorStack
    }, { status: 500 });
  }
}
