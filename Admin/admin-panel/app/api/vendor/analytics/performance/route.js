import { NextResponse } from 'next/server';
import { supabaseRestGet } from '../../../../../lib/supabaseAdminFetch';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const vendorId = searchParams.get('vendorId');

        if (!vendorId) {
            return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
        }

        // 1. Fetch leads (calls, WhatsApp clicks) from vendor_leads table
        const leadsQuery = `/rest/v1/vendor_leads?vendor_id=eq.${encodeURIComponent(vendorId)}&select=*`;
        const leads = await supabaseRestGet(leadsQuery).catch(() => []);

        // 2. Fetch views (profile visits) from vendor_views table
        const viewsQuery = `/rest/v1/vendor_views?vendor_id=eq.${encodeURIComponent(vendorId)}&select=*`;
        const views = await supabaseRestGet(viewsQuery).catch(() => []);

        // 3. Fetch enquiry count from vendor_enquiries
        const enquiriesQuery = `/rest/v1/vendor_enquiries?vendor_id=eq.${encodeURIComponent(vendorId)}&select=id`;
        const enquiries = await supabaseRestGet(enquiriesQuery).catch(() => []);

        // Process stats (group by type)
        const stats = {
            leads: leads.length,
            views: views.length,
            enquiries: enquiries.length,
            calls: leads.filter(l => l.type === 'call').length,
            whatsapp: leads.filter(l => l.type === 'whatsapp').length,
            recentLeads: leads.slice(0, 5),
        };

        return NextResponse.json({ success: true, stats });
    } catch (error) {
        console.error('Vendor Performance API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
