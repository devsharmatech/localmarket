import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

// GET /api/price-verification/flags - Get flagged products
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    let query = `/rest/v1/price_flags?select=*&status=eq.${status}&order=flagged_at.desc`;
    const flags = await supabaseRestGet(query);
    return NextResponse.json(flags);
  } catch (error) {
    console.error('Error fetching price flags:', error);
    if (error.message && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND'))) {
      return NextResponse.json({ flags: [], warning: 'offline_mode' }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/price-verification/flags - Update flag status
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const updates = {
      status,
      resolved_at: status !== 'pending' ? new Date().toISOString() : null,
      notes: notes || null,
    };

    const result = await supabaseRestPatch(`/rest/v1/price_flags?id=eq.${id}`, updates);

    // If status is 'vendor_blocked', also update vendor status
    if (status === 'vendor_blocked') {
      const flag = await supabaseRestGet(`/rest/v1/price_flags?id=eq.${id}&select=vendor_id`);
      if (flag && flag[0] && flag[0].vendor_id) {
        await supabaseRestPatch(`/rest/v1/vendors?id=eq.${flag[0].vendor_id}`, { status: 'Blocked' });
      }
    }

    // If status is 'hidden', hide the product
    if (status === 'hidden') {
      const flag = await supabaseRestGet(`/rest/v1/price_flags?id=eq.${id}&select=vendor_product_id`);
      if (flag && flag[0] && flag[0].vendor_product_id) {
        await supabaseRestPatch(`/rest/v1/vendor_products?id=eq.${flag[0].vendor_product_id}`, { is_active: false });
      }
    }

    return NextResponse.json(result[0] || result);
  } catch (error) {
    console.error('Error updating price flag:', error);
    if (error.message && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND'))) {
      return NextResponse.json({ success: false, warning: 'Sync failed: Database unreachable' });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
