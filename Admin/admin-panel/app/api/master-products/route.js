import { supabaseRestGet, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

function toStr(v) {
    return typeof v === 'string' ? v.trim() : '';
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const q = toStr(searchParams.get('q'));
        const categoryId = toStr(searchParams.get('categoryId'));
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        const query = new URLSearchParams();
        query.set('select', 'id,name,brand,uom,default_mrp,category_id,image_url');
        query.set('order', 'name.asc');
        query.set('limit', limit.toString());
        query.set('offset', offset.toString());

        if (q) {
            query.set('name', `ilike.*${q}*`);
        }
        if (categoryId) {
            query.set('category_id', `eq.${categoryId}`);
        }

        const rows = await supabaseRestGet(`/rest/v1/master_products?${query.toString()}`);
        const products = Array.isArray(rows) ? rows : [];

        return Response.json({ products, total: products.length }, { status: 200 });
    } catch (e) {
        console.error('Master Products GET Error:', e);
        if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
            return Response.json({ products: [], total: 0, warning: 'offline_mode' }, { status: 200 });
        }
        return Response.json({ error: e?.message || 'Failed to load products' }, { status: 500 });
    }
}

// DELETE /api/master-products - Delete products
export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = toStr(searchParams.get('id'));
        const deleteAll = searchParams.get('deleteAll') === 'true';

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return Response.json({ error: 'Supabase configuration missing' }, { status: 500 });
        }

        if (deleteAll) {
            // Delete all products - need to fetch all IDs first, then delete in batches
            // Or use a WHERE clause that matches all (id=not.is.null)
            try {
                // First, get all product IDs
                const allProducts = await supabaseRestGet('/rest/v1/master_products?select=id');
                const productIds = Array.isArray(allProducts) ? allProducts.map(p => p.id) : [];

                if (productIds.length === 0) {
                    return Response.json({ success: true, message: 'No products to delete' }, { status: 200 });
                }

                // Delete products in batches (Supabase has limits)
                const batchSize = 100;
                let deletedCount = 0;

                for (let i = 0; i < productIds.length; i += batchSize) {
                    const batch = productIds.slice(i, i + batchSize);
                    // PostgREST syntax: id=in.(uuid1,uuid2,uuid3)
                    const idsFilter = batch.join(',');
                    const url = `${SUPABASE_URL}/rest/v1/master_products?id=in.(${idsFilter})`;

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
                        throw new Error(`Delete batch failed: ${text || res.statusText}`);
                    }

                    deletedCount += batch.length;
                }

                return Response.json({ success: true, message: `Successfully deleted ${deletedCount} products` }, { status: 200 });
            } catch (e) {
                throw new Error(`Delete all failed: ${e.message}`);
            }
        } else if (id) {
            // Delete single product
            const url = `${SUPABASE_URL}/rest/v1/master_products?id=eq.${id}`;
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

            return Response.json({ success: true, message: 'Product deleted successfully' }, { status: 200 });
        } else {
            return Response.json({ error: 'Product ID or deleteAll parameter required' }, { status: 400 });
        }
    } catch (e) {
        console.error('Master Products DELETE Error:', e);
        if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
            return Response.json({ success: false, warning: 'Sync failed: Database unreachable' });
        }
        return Response.json({ error: e?.message || 'Failed to delete products' }, { status: 500 });
    }
}

// PATCH /api/master-products - Update a product
export async function PATCH(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = toStr(searchParams.get('id'));
        const body = await req.json();

        if (!id) {
            return Response.json({ error: 'Product ID is required' }, { status: 400 });
        }

        // Prepare update data
        const updateData = {};
        if (body.name !== undefined) updateData.name = toStr(body.name);
        if (body.brand !== undefined) updateData.brand = toStr(body.brand) || null;
        if (body.uom !== undefined) updateData.uom = toStr(body.uom) || null;
        if (body.default_mrp !== undefined) {
            const mrp = Number(body.default_mrp);
            updateData.default_mrp = isNaN(mrp) ? null : mrp;
        }
        if (body.category_id !== undefined) {
            updateData.category_id = body.category_id || null;
        }
        if (body.image_url !== undefined) {
            updateData.image_url = toStr(body.image_url) || null;
        }

        if (Object.keys(updateData).length === 0) {
            return Response.json({ error: 'No fields to update' }, { status: 400 });
        }

        const result = await supabaseRestPatch(`/rest/v1/master_products?id=eq.${id}`, updateData);
        return Response.json({ success: true, product: result[0] || result }, { status: 200 });
    } catch (e) {
        console.error('Master Products PATCH Error:', e);
        if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
            return Response.json({ success: false, warning: 'Sync failed: Database unreachable' });
        }
        return Response.json({ error: e?.message || 'Failed to update product' }, { status: 500 });
    }
}
