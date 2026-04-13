import { NextResponse } from 'next/server';
import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

// GET /api/reports/search - Get search reports
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const state = searchParams.get('state');
        const city = searchParams.get('city');

        // Fetch 14 days of logs to calculate trends (current 7 vs previous 7)
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const fourteenDaysAgo = new Date(now);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        let supabaseQuery = `/rest/v1/search_logs?searched_at=gte.${fourteenDaysAgo.toISOString()}&select=search_query,location_state,location_city,location_town,searched_at`;
        const filters = [];
        if (state && state !== 'all') {
            filters.push(`location_state=eq.${encodeURIComponent(state)}`);
        }
        if (city && city !== 'all') {
            filters.push(`location_city=eq.${encodeURIComponent(city)}`);
        }

        if (filters.length > 0) {
            supabaseQuery += '&' + filters.join('&');
        }

        supabaseQuery += '&order=searched_at.desc';

        let logs = [];
        try {
            logs = await supabaseRestGet(supabaseQuery);
            logs = Array.isArray(logs) ? logs : [];
        } catch (e) {
            console.warn('search_logs table fetching error:', e.message);
            logs = [];
        }

        // Aggregate by search query and period
        const searchMetrics = {};
        logs.forEach(log => {
            const rawQuery = log.search_query || '';
            const key = rawQuery.toLowerCase().trim();
            if (!key) return;

            if (!searchMetrics[key]) {
                searchMetrics[key] = {
                    product: rawQuery,
                    currentCount: 0,
                    previousCount: 0,
                    location: log.location_city || log.location_state || 'Multiple'
                };
            }

            const searchedAt = new Date(log.searched_at);
            if (searchedAt >= sevenDaysAgo) {
                searchMetrics[key].currentCount++;
            } else {
                searchMetrics[key].previousCount++;
            }
        });

        // Convert to array and calculate trends
        const topSearches = Object.values(searchMetrics)
            .map(item => {
                let trend = '0%';
                if (item.previousCount === 0) {
                    trend = item.currentCount > 0 ? '+100%' : '0%';
                } else {
                    const change = ((item.currentCount - item.previousCount) / item.previousCount) * 100;
                    trend = `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`;
                }
                
                return {
                    product: item.product,
                    count: item.currentCount,
                    location: item.location,
                    trend: trend
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return NextResponse.json(topSearches);
    } catch (error) {
        console.error('Error fetching search reports:', error);
        // Return empty array instead of error to allow UI to load
        return NextResponse.json([]);
    }
}
