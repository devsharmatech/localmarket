import { NextResponse } from 'next/server';
import { supabaseRestGet } from '../../../../../lib/supabaseAdminFetch';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const city = searchParams.get('city');
        const category = searchParams.get('category') || '';

        if (!city) {
            return NextResponse.json({ error: 'City is required' }, { status: 400 });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Fetch city-specific trending items from search_logs
        let query = `/rest/v1/search_logs?location_city=ilike.${encodeURIComponent('%' + city + '%')}&searched_at=gte.${thirtyDaysAgo.toISOString()}&select=search_query`;
        let logs = await supabaseRestGet(query).catch(() => []);

        // 2. Fallback to general trending if local logs are low
        if (logs.length < 3) {
            query = `/rest/v1/search_logs?searched_at=gte.${thirtyDaysAgo.toISOString()}&select=search_query&limit=200`;
            logs = await supabaseRestGet(query).catch(() => []);
        }

        // Group and count unique searches
        const counts = {};
        logs.forEach((log) => {
            const q = log.search_query?.toLowerCase().trim();
            if (q) {
                counts[q] = (counts[q] || 0) + 1;
            }
        });

        const trending = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([query, count]) => ({ query, count }));

        // 3. Generate Recommendations for the vendor
        const recommendations = [];
        
        if (trending.length > 0) {
            const topTrend = trending[0].query;
            recommendations.push({
                type: 'product',
                title: `Highlight ${topTrend.charAt(0).toUpperCase() + topTrend.slice(1)}`,
                description: `Many customers in ${city} are searching for "${topTrend}". Consider adding this to your profile.`,
                priority: 'high',
                icon: 'Package'
            });
        }

        recommendations.push({
            type: 'pricing',
            title: 'Competitive Price Check',
            description: 'Check out the "Market Comparison" tab to see if your prices are the lowest in your circle.',
            priority: 'medium',
            icon: 'DollarSign'
        });

        if (category) {
            recommendations.push({
                type: 'visibility',
                title: `${category} Demand`,
                description: `Local searches for ${category} are up by 12% this week in Hall Bazaar.`,
                priority: 'high',
                icon: 'Target'
            });
        }

        return NextResponse.json({ 
            success: true,
            trending, 
            recommendations,
            meta: {
                scope: logs.length > 0 && logs[0].location_city ? 'local' : 'general',
                processedLogs: logs.length
            }
        });
    } catch (error) {
        console.error('Trending fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
