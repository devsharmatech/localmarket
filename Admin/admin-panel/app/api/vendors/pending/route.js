import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

export async function GET() {
  try {
    const query = new URLSearchParams();
    query.set('select', '*');
    // Basic rule: pending vendors are those with status Pending OR kyc_status Pending
    query.set('or', '(status.eq.Pending,kyc_status.eq.Pending)');
    query.set('order', 'created_at.desc');
    query.set('limit', '200');

    const rows = await supabaseRestGet(`/rest/v1/vendors?${query.toString()}`);
    return Response.json({ vendors: Array.isArray(rows) ? rows : [] }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e?.message || 'Failed to load pending vendors' }, { status: 500 });
  }
}

