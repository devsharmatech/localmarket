import { supabaseRestGet, supabaseRestInsert, supabaseRestPatch, supabaseRestDelete } from '@/lib/supabaseAdminFetch';

function toStr(v) {
    return typeof v === 'string' ? v.trim() : '';
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const state = toStr(searchParams.get('state'));
        const city = toStr(searchParams.get('city'));
        const town = toStr(searchParams.get('town'));
        const tehsil = toStr(searchParams.get('tehsil'));
        const subTehsil = toStr(searchParams.get('subTehsil'));
        const circle = toStr(searchParams.get('circle'));
        const limit = Math.min(Number(searchParams.get('limit') || 500), 2000);

        const query = new URLSearchParams();
        query.set('select', '*');
        query.set('order', 'state.asc,city.asc,town.asc,tehsil.asc,sub_tehsil.asc');
        query.set('limit', String(limit));

        if (state) query.set('state', `eq.${state}`);
        if (city) query.set('city', `eq.${city}`);
        if (town) query.set('town', `eq.${town}`);
        if (tehsil) query.set('tehsil', `eq.${tehsil}`);
        if (subTehsil) query.set('sub_tehsil', `eq.${subTehsil}`);
        if (circle) query.set('circle', `eq.${circle}`);

        const rows = await supabaseRestGet(`/rest/v1/locations?${query.toString()}`);
        return Response.json({ locations: Array.isArray(rows) ? rows : [] }, { status: 200 });
    } catch (e) {
        const errorMessage = e?.message || String(e) || 'Failed to load locations';

        // If table doesn't exist, return empty array instead of error
        // This allows the UI to still work and show the import option
        if (errorMessage.includes('does not exist') ||
            errorMessage.includes('relation') ||
            errorMessage.includes('PGRST205') ||
            errorMessage.includes('Could not find the table')) {
            console.warn('Locations table may not exist. Returning empty array. Run sql/create_locations_table.sql to create it.');
            return Response.json({ locations: [] }, { status: 200 });
        }

        console.error('Error loading locations:', errorMessage);
        if (errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND')) {
            return Response.json({ locations: [], warning: 'offline_mode' }, { status: 200 });
        }
        return Response.json({
            error: errorMessage,
            hint: 'If the locations table does not exist, run: sql/create_locations_table.sql'
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => null);
        const state = toStr(body?.state);
        const city = toStr(body?.city);
        const town = toStr(body?.town);
        const tehsil = toStr(body?.tehsil);
        const sub_tehsil = toStr(body?.subTehsil || body?.sub_tehsil);
        const circle = toStr(body?.circle) || null;
        const market_icon = body?.marketIcon || body?.market_icon || null;

        if (!state || !city || !town || !tehsil || !sub_tehsil) {
            return Response.json(
                { error: 'state, city, town, tehsil, subTehsil are required' },
                { status: 400 }
            );
        }

        const inserted = await supabaseRestInsert('/rest/v1/locations', [
            { state, city, town, tehsil, sub_tehsil, circle, market_icon },
        ]);
        return Response.json({ location: Array.isArray(inserted) ? inserted[0] : inserted }, { status: 200 });
    } catch (e) {
        let errorMessage = e?.message || 'Failed to add location';
        if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
            errorMessage = 'The locations table does not exist. Run sql/create_locations_table.sql';
        }
        return Response.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const body = await req.json().catch(() => null);
        const id = body?.id;
        const renameFrom = body?.renameFrom;
        const renameTo = body?.renameTo;

        if (id) {
            const patch = {};
            if (body.state !== undefined) patch.state = toStr(body.state);
            if (body.city !== undefined) patch.city = toStr(body.city);
            if (body.town !== undefined) patch.town = toStr(body.town);
            if (body.tehsil !== undefined) patch.tehsil = toStr(body.tehsil);
            if (body.subTehsil !== undefined) patch.sub_tehsil = toStr(body.subTehsil);
            if (body.circle !== undefined) patch.circle = toStr(body.circle) || null;
            if (body.marketIcon !== undefined || body.market_icon !== undefined) {
                patch.market_icon = body.marketIcon || body.market_icon || null;
            }

            const updated = await supabaseRestPatch(`/rest/v1/locations?id=eq.${id}`, patch);
            return Response.json({ location: Array.isArray(updated) ? updated[0] : updated }, { status: 200 });
        } else if (renameFrom) { // Handle renaming circle and/or updating market_icon for all locations in that circle
            const updates = {};
            if (renameTo) updates.circle = renameTo;
            if (body.marketIcon !== undefined || body.market_icon !== undefined) {
                updates.market_icon = body.marketIcon || body.market_icon || null;
            }

            if (Object.keys(updates).length === 0) {
                return Response.json({ error: 'No updates provided for circle' }, { status: 400 });
            }

            const updatedLocations = await supabaseRestPatch(
                `/rest/v1/locations?circle=eq.${encodeURIComponent(renameFrom)}`,
                updates
            );

            if (renameTo) {
                try {
                    await supabaseRestPatch(
                        `/rest/v1/vendors?circle=eq.${encodeURIComponent(renameFrom)}`,
                        { circle: renameTo }
                    );
                } catch (ve) {
                    console.error('Failed to rename circle in vendors table:', ve);
                }
            }

            return Response.json({ success: true, updatedCount: Array.isArray(updatedLocations) ? updatedLocations.length : 1 }, { status: 200 });
        } else if (body?.renameCircleFrom && body?.renameCircleTo) {
            const updates = { 
                town: body.renameCircleTo, 
                tehsil: body.renameCircleTo, 
                sub_tehsil: body.renameCircleTo 
            };
            const updated = await supabaseRestPatch(
                `/rest/v1/locations?town=eq.${encodeURIComponent(body.renameCircleFrom)}`,
                updates
            );
            return Response.json({ success: true, updatedCount: Array.isArray(updated) ? updated.length : 1 }, { status: 200 });
        }

        return Response.json({ error: 'id or renameFrom/renameTo required' }, { status: 400 });
    } catch (e) {
        return Response.json({ error: e?.message || 'Failed to update location' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const marketName = searchParams.get('marketName');
        const circleNameParam = searchParams.get('circleName');

        if (id) {
            await supabaseRestDelete(`/rest/v1/locations?id=eq.${id}`);
            return Response.json({ success: true }, { status: 200 });
        } else if (marketName) {
            // Use DELETE instead of PATCH to remove the specific market record
            await supabaseRestDelete(`/rest/v1/locations?circle=eq.${encodeURIComponent(marketName)}`);
            
            // Still PATCH vendors to NULL so they are unassigned but not deleted
            try {
                await supabaseRestPatch(
                    `/rest/v1/vendors?circle=eq.${encodeURIComponent(marketName)}`,
                    { circle: null }
                );
            } catch (ve) {
                console.error('Failed to clear circle in vendors table:', ve);
            }

            return Response.json({ success: true }, { status: 200 });
        } else if (circleNameParam) {
            // Deleting an entire circle (town/area)
            await supabaseRestDelete(`/rest/v1/locations?town=eq.${encodeURIComponent(circleNameParam)}`);
            return Response.json({ success: true }, { status: 200 });
        }

        return Response.json({ error: 'id, marketName or circleName required' }, { status: 400 });
    } catch (e) {
        return Response.json({ error: e?.message || 'Failed to delete location/market' }, { status: 500 });
    }
}

