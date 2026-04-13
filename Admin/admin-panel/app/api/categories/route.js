import { supabaseRestGet, supabaseRestInsert, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

function toStr(v) {
    return typeof v === 'string' ? v.trim() : '';
}

function normalizeCategory(c) {
    return {
        id: c.id ?? c.category_id ?? c.categoryId,
        name: c.name ?? c.title ?? '',
        iconName: c.iconName ?? c.icon_name ?? null,
        iconUrl: c.iconUrl ?? c.icon_url ?? null,
        imageUrl: c.imageUrl ?? c.image_url ?? null,
        priority: c.priority ?? c.sort_order ?? 999,
        visible: c.visible ?? c.is_visible ?? true,
        // optional denormalized fields (if you provide a view)
        productCount: c.productCount ?? c.product_count ?? null,
    };
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const q = toStr(searchParams.get('q'));

        const query = new URLSearchParams();
        query.set('select', '*');
        query.set('order', 'priority.asc');
        if (q) query.set('name', `ilike.*${q}*`);

        const rows = await supabaseRestGet(`/rest/v1/categories?${query.toString()}`);
        const categories = Array.isArray(rows) ? rows.map(normalizeCategory) : [];

        return Response.json({ categories }, { status: 200 });
    } catch (e) {
        console.error('Categories GET Error:', e);
        if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
            return Response.json({ categories: [], warning: 'offline_mode' }, { status: 200 });
        }
        return Response.json({ error: e?.message || 'Failed to load categories' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();

        // Handle single category creation
        if (body.name) {
            // Categories table uses UUID primary key, so we don't set id
            const category = {
                name: toStr(body.name),
                icon_name: body.iconName || body.icon_name || null,
                icon_url: body.iconUrl || body.icon_url || null,
                image_url: body.imageUrl || body.image_url || null,
                priority: body.priority ?? 999,
                visible: body.visible !== undefined ? body.visible : true,
            };

            // Check if category exists by name first
            try {
                const existing = await supabaseRestGet(`/rest/v1/categories?name=eq.${encodeURIComponent(category.name)}&select=id`);
                if (Array.isArray(existing) && existing.length > 0) {
                    // Update existing
                    const result = await supabaseRestPatch(`/rest/v1/categories?id=eq.${existing[0].id}`, category);
                    return Response.json({ success: true, category: result[0] || result }, { status: 200 });
                }
            } catch (e) {
                // If check fails, proceed with insert
            }

            // Insert new category
            const result = await supabaseRestInsert('/rest/v1/categories', [category]);
            return Response.json({ success: true, category: result[0] || result }, { status: 201 });
        }

        // Handle bulk import
        if (Array.isArray(body.categories)) {
            const payload = body.categories.map(cat => ({
                name: toStr(cat.name),
                icon_name: cat.iconName || cat.icon_name || null,
                icon_url: cat.iconUrl || cat.icon_url || null,
                image_url: cat.imageUrl || cat.image_url || null,
                priority: cat.priority ?? 999,
                visible: cat.visible !== undefined ? cat.visible : true,
            }));

            // For bulk, just insert (duplicates will be handled by unique constraint on name if it exists)
            const result = await supabaseRestInsert('/rest/v1/categories', payload);
            return Response.json({
                success: true,
                inserted: Array.isArray(result) ? result.length : payload.length
            }, { status: 201 });
        }

        return Response.json({ error: 'Invalid request. Provide name or categories array.' }, { status: 400 });
    } catch (e) {
        console.error('Categories POST Error:', e);
        if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
            return Response.json({ success: false, warning: 'Sync failed: Database unreachable' });
        }
        return Response.json({ error: e?.message || 'Failed to create category' }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = toStr(searchParams.get('id'));
        const body = await req.json();

        if (!id) {
            return Response.json({ error: 'Category ID is required' }, { status: 400 });
        }

        // Prepare update data
        const updateData = {};
        if (body.name !== undefined) updateData.name = toStr(body.name);
        if (body.icon_name !== undefined || body.iconName !== undefined) {
            updateData.icon_name = body.icon_name || body.iconName || null;
        }
        if (body.icon_url !== undefined || body.iconUrl !== undefined) {
            updateData.icon_url = body.icon_url || body.iconUrl || null;
        }
        if (body.image_url !== undefined || body.imageUrl !== undefined) {
            updateData.image_url = body.image_url || body.imageUrl || null;
        }
        if (body.priority !== undefined) {
            const priority = Number(body.priority);
            updateData.priority = isNaN(priority) ? 999 : priority;
        }
        if (body.visible !== undefined) {
            updateData.visible = body.visible === true || body.visible === 'true';
        }

        if (Object.keys(updateData).length === 0) {
            return Response.json({ error: 'No fields to update' }, { status: 400 });
        }

        const result = await supabaseRestPatch(`/rest/v1/categories?id=eq.${id}`, updateData);
        return Response.json({ success: true, category: result[0] || result }, { status: 200 });
    } catch (e) {
        console.error('Categories PATCH Error:', e);
        if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
            return Response.json({ success: false, warning: 'Sync failed: Database unreachable' });
        }
        return Response.json({ error: e?.message || 'Failed to update category' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = toStr(searchParams.get('id'));

        if (!id) {
            return Response.json({ error: 'Category ID is required' }, { status: 400 });
        }

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return Response.json({ error: 'Supabase configuration missing' }, { status: 500 });
        }

        const url = `${SUPABASE_URL}/rest/v1/categories?id=eq.${id}`;
        const res = await fetch(url, {
            method: 'DELETE',
            headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
            },
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Delete failed: ${text || res.statusText}`);
        }

        return Response.json({ success: true, message: 'Category deleted successfully' }, { status: 200 });
    } catch (e) {
        console.error('Categories DELETE Error:', e);
        if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
            return Response.json({ success: false, warning: 'Sync failed: Database unreachable' });
        }
        return Response.json({ error: e?.message || 'Failed to delete category' }, { status: 500 });
    }
}

