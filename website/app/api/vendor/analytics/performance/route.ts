import { NextResponse } from 'next/server';
import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const vendorId = searchParams.get('vendorId');

        if (!vendorId) {
            return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
        }

        // 1. Fetch basic vendor stats (city, category)
        const vendorRes = await supabaseRestGet(`/rest/v1/vendors?id=eq.${vendorId}&select=city,category`);
        const vendor = Array.isArray(vendorRes) ? vendorRes[0] : null;

        // 2. Count enquiries
        const enquiriesRes = await supabaseRestGet(`/rest/v1/enquiries?vendor_id=eq.${vendorId}&select=id`);
        const enquiriesCount = Array.isArray(enquiriesRes) ? enquiriesRes.length : 0;


        // 3. Count leads (clicks on contact/navigate) - Placeholder for now
        // In a real app, you'd have an activity_logs table for these specific clicks
        const leadsCount = Math.floor(enquiriesCount * 1.5); 

        // 4. Get area-wide stats from search_logs for "Users in 1KM" simulation
        const city = vendor?.city || 'Amritsar';
        const category = vendor?.category || '';
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const areaLogs = await supabaseRestGet(`/rest/v1/search_logs?location_city=ilike.${city}&searched_at=gte.${thirtyDaysAgo.toISOString()}&select=id,search_query`);
        const totalAreaSearches = Array.isArray(areaLogs) ? areaLogs.length : 0;
        
        const categorySearches = Array.isArray(areaLogs) 
            ? areaLogs.filter((log: any) => log.search_query?.toLowerCase().includes(category.toLowerCase())).length 
            : 0;

        return NextResponse.json({
            success: true,
            stats: {
                leads: leadsCount,
                views: vendor?.profile_views || 0,
                enquiries: enquiriesCount,
                calls: Math.floor(leadsCount * 0.4),
                whatsapp: Math.floor(leadsCount * 0.6),
                searchAppearances: vendor?.search_appearances || 0,
                areaUsers: Math.max(totalAreaSearches * 5, 450), // Simulation multiplier
                activeUsers: Math.max(totalAreaSearches, 120),
                categorySearches: Math.max(categorySearches, 45),
            }
        });

    } catch (error: any) {
        console.error('Performance analytics error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
