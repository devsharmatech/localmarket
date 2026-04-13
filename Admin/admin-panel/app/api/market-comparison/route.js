import { NextResponse } from 'next/server';
import { supabaseRestGet } from '../../../lib/supabaseAdminFetch';

export async function GET(request) {
    try {
        // Fetch from the market_comparison_stats view which calculates everything
        const stats = await supabaseRestGet('/rest/v1/market_comparison_stats?select=*').catch(() => []);

        // Also fetch circle metadata from locations table for icons/styles
        const locations = await supabaseRestGet('/rest/v1/locations?select=circle,market_icon,city').catch(() => []);
        const circleMeta = {};
        locations.forEach(loc => {
            if (loc.circle && !circleMeta[loc.circle]) {
                circleMeta[loc.circle] = { icon: loc.market_icon, city: loc.city };
            }
        });

        const formattedStats = (stats || []).map(s => ({
            circle: s.circle,
            city: circleMeta[s.circle]?.city || '',
            lower_price_pct: s.lower_price_pct || 0,
            common_products_count: s.common_products_count || 0,
            avg_price_this_market: s.avg_price_this_market || 0,
            avg_price_others: s.avg_price_others || 0,
            icon: circleMeta[s.circle]?.icon || null,
        }));

        return NextResponse.json({ success: true, stats: formattedStats });
    } catch (error) {
        console.error('Market Comparison Stats Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
