import { NextResponse } from 'next/server';
import { supabaseRestGet } from '../../../lib/supabaseAdminFetch';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const cityParam = searchParams.get('city') || '';
        const isAllPrefix = cityParam.startsWith('All ');
        let areaName = isAllPrefix ? cityParam.replace('All ', '').trim() : cityParam.trim();

        // ─── ENHANCE MATCHING: Strip common suffixes (City, Town, Tehsil) for broader matching ───
        const baseAreaName = areaName.replace(/\s+(City|Town|Tehsil|Sub-Tehsil)$/i, '').trim();

        let query = '/rest/v1/locations?select=city,state,town,circle,market_icon';
        let locations = [];

        if (areaName) {
            if (isAllPrefix) {
                // Hierarchical aggregation (All in State, City, Town, or Tehsil)
                const searchFilters = [
                    `state=ilike.${encodeURIComponent('%' + areaName + '%')}`,
                    `city=ilike.${encodeURIComponent('%' + areaName + '%')}`,
                    `town=ilike.${encodeURIComponent('%' + areaName + '%')}`,
                    `tehsil=ilike.${encodeURIComponent('%' + areaName + '%')}`,
                    `city=ilike.${encodeURIComponent('%' + baseAreaName + '%')}`,
                    `town=ilike.${encodeURIComponent('%' + baseAreaName + '%')}`
                ];

                for (const filter of searchFilters) {
                    const levelQuery = `${query}&${filter}`;
                    const currentLocs = await supabaseRestGet(levelQuery).catch(() => []);
                    if (currentLocs && Array.isArray(currentLocs) && currentLocs.length > 0) {
                        locations = [...locations, ...currentLocs];
                    }
                }
            } else {
                // Specific selection (City or Circle)
                const areaFilters = [
                    `city=eq.${encodeURIComponent(areaName)}`,
                    `town=eq.${encodeURIComponent(areaName)}`,
                    `state=eq.${encodeURIComponent(areaName)}`
                ];

                for (const filter of areaFilters) {
                    const levelQuery = `${query}&${filter}`;
                    const currentLocs = await supabaseRestGet(levelQuery).catch(() => []);
                    if (currentLocs && currentLocs.length > 0) {
                        locations = [...locations, ...currentLocs];
                    }
                }

                // If nothing found, try partial match
                if (locations.length === 0) {
                    const ilikeFilters = [
                        `city=ilike.${encodeURIComponent('%' + areaName + '%')}`,
                        `town=ilike.${encodeURIComponent('%' + areaName + '%')}`
                    ];
                    for (const filter of ilikeFilters) {
                        const ilikeQuery = `${query}&${filter}`;
                        const currentLocs = await supabaseRestGet(ilikeQuery).catch(() => []);
                        if (currentLocs && currentLocs.length > 0) {
                            locations = [...locations, ...currentLocs];
                        }
                    }
                }

                // If still nothing found, try matching by circle name
                if (locations.length === 0) {
                    const circleMatchQuery = `${query}&or=(circle.eq.${encodeURIComponent(areaName)},circle.ilike.${encodeURIComponent('%' + areaName + '%')})&limit=1`;
                    const circleMatch = await supabaseRestGet(circleMatchQuery).catch(() => []);
                    if (circleMatch && circleMatch.length > 0) {
                        const parentCity = circleMatch[0].city;
                        locations = await supabaseRestGet(`${query}&city=eq.${encodeURIComponent(parentCity)}`).catch(() => []);
                    }
                }
            }
        }

        if (!Array.isArray(locations)) {
            throw new Error('Failed to fetch locations');
        }

        // Fetch vendor counts per circle
        const vendors = await supabaseRestGet('/rest/v1/vendors?select=circle,status').catch(() => []);
        const circleStats = {};

        vendors.forEach((v) => {
            if (v.circle && (v.status === 'Active' || v.status === 'Pending')) {
                if (!circleStats[v.circle]) {
                    circleStats[v.circle] = { shops: 0 };
                }
                circleStats[v.circle].shops++;
            }
        });

        // Map metadata from locations to circles
        const circlesMap = {};
        locations.forEach((loc) => {
            if (loc.circle) {
                if (!circlesMap[loc.circle]) {
                    circlesMap[loc.circle] = {
                        name: loc.circle,
                        city: loc.city,
                        town: loc.town || loc.city,
                        shops: circleStats[loc.circle]?.shops || 0,
                        icon: loc.market_icon || null,
                        ...getCircleStyle(loc.circle)
                    };
                }
            }
        });

        const circles = Object.values(circlesMap);
        return NextResponse.json({ success: true, circles });
    } catch (error) {
        console.error('Circles API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function getCircleStyle(name) {
    const styles = {
        'Hall Bazaar': { color: 'from-orange-500 to-amber-400', emoji: '🛍️' },
        'Golden Temple': { color: 'from-amber-400 to-yellow-600', emoji: '🕌' },
        'Ranjit Avenue': { color: 'from-emerald-500 to-teal-600', emoji: '🏙️' },
        'Lawrence Road': { color: 'from-indigo-500 to-blue-600', emoji: '🏢' },
        'South Circle': { color: 'from-red-500 to-rose-400', emoji: '📍' },
    };

    return styles[name] || {
        color: 'from-slate-500 to-slate-400',
        emoji: '📍'
    };
}
