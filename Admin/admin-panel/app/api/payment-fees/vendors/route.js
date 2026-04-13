import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

// GET /api/payment-fees/vendors - Get vendor billing status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let query = `/rest/v1/vendor_billing?select=*,vendors(id,name,contact_number,city,state,category)&order=due_date.asc`;
    if (status) {
      query += `&status=eq.${status}`;
    }
    
    const billing = await supabaseRestGet(query);
    return NextResponse.json(billing);
  } catch (error) {
    console.error('Error fetching vendor billing:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/payment-fees/vendors - Update vendor billing status
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { vendor_id, status, plan, amount, due_date } = body;
    
    if (!vendor_id) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }
    
    const updates = {};
    if (status) updates.status = status;
    if (plan) updates.plan = plan;
    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (due_date) updates.due_date = due_date;
    if (status === 'paid') updates.paid_at = new Date().toISOString();
    
    // Update billing record
    const billing = await supabaseRestGet(`/rest/v1/vendor_billing?vendor_id=eq.${vendor_id}&select=id&order=created_at.desc&limit=1`);
    if (billing && billing[0]) {
      await supabaseRestPatch(`/rest/v1/vendor_billing?id=eq.${billing[0].id}`, updates);
    } else {
      // Create new billing record
      const { supabaseRestInsert } = await import('../../../../lib/supabaseAdminFetch');
      await supabaseRestInsert('/rest/v1/vendor_billing', {
        vendor_id,
        plan: plan || 'monthly',
        amount: amount || 999,
        status: status || 'pending',
        due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }
    
    // Update vendor status if blocking/activating
    if (status === 'blocked') {
      await supabaseRestPatch(`/rest/v1/vendors?id=eq.${vendor_id}`, { status: 'Blocked' });
    } else if (status === 'paid') {
      await supabaseRestPatch(`/rest/v1/vendors?id=eq.${vendor_id}`, { status: 'Active' });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating vendor billing:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
