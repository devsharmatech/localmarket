import { supabaseRestGet, supabaseRestPatch, supabaseRestInsert } from '@/lib/supabaseAdminFetch';

function toStr(v) {
    return typeof v === 'string' ? v : '';
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const vendorId = toStr(searchParams.get('vendorId'));
        const id = toStr(searchParams.get('id'));

        if (id) {
            // Get single product by ID
            try {
                const query = new URLSearchParams();
                query.set('select', 'id,name,price,mrp,online_price,uom,category_id,vendor_id,description,is_active,image_url,updated_at');
                query.set('id', `eq.${id}`);
                const rows = await supabaseRestGet(`/rest/v1/vendor_products?${query.toString()}`);
                const product = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
                if (product) {
                    product.status = product.is_active ? 'Active' : 'Inactive';
                }
                return Response.json({ product }, { status: 200 });
            } catch (error) {
                console.error('Error fetching product by ID:', error);
                return Response.json({ product: null }, { status: 200 });
            }
        }

        if (!vendorId) {
            return Response.json({ error: 'vendorId is required' }, { status: 400 });
        }

        // Validate vendorId format
        if (vendorId.trim() === '') {
            return Response.json({ error: 'vendorId cannot be empty' }, { status: 400 });
        }

        try {
            const query = new URLSearchParams();
            query.set('select', 'id,name,price,mrp,online_price,uom,category_id,description,is_active,image_url,updated_at');
            query.set('vendor_id', `eq.${encodeURIComponent(vendorId)}`);
            query.set('order', 'name.asc');

            const rows = await supabaseRestGet(`/rest/v1/vendor_products?${query.toString()}`);
            const products = Array.isArray(rows) ? rows.map(p => ({
                ...p,
                status: p.is_active ? 'Active' : 'Inactive'
            })) : [];
            return Response.json({ products }, { status: 200 });
        } catch (error) {
            console.error('Error fetching vendor products:', error);
            console.error('VendorId:', vendorId);
            // Return empty array instead of error to prevent app crashes
            return Response.json({ products: [] }, { status: 200 });
        }
    } catch (e) {
        console.error('Unexpected error in vendor-products GET:', e);
        if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
            return Response.json({ products: [], warning: 'offline_mode' }, { status: 200 });
        }
        return Response.json({ error: e?.message || 'Failed to load vendor products', products: [] }, { status: 500 });
    }
}

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
        if (body.price !== undefined) {
            const price = Number(body.price);
            updateData.price = isNaN(price) ? null : price;
        }
        if (body.mrp !== undefined) {
            const mrp = Number(body.mrp);
            updateData.mrp = isNaN(mrp) ? null : mrp;
        }
        if (body.online_price !== undefined) {
            const onlinePrice = Number(body.online_price);
            updateData.online_price = isNaN(onlinePrice) ? null : onlinePrice;
        }
        if (body.uom !== undefined) updateData.uom = toStr(body.uom) || null;
        if (body.category_id !== undefined) {
            updateData.category_id = body.category_id || null;
        }
        if (body.image_url !== undefined) {
            updateData.image_url = toStr(body.image_url) || null;
        }
        if (body.description !== undefined) {
            updateData.description = toStr(body.description) || null;
        }
        if (body.status !== undefined) {
            updateData.is_active = body.status === 'Inactive' ? false : true;
        }

        if (Object.keys(updateData).length === 0) {
            return Response.json({ error: 'No fields to update' }, { status: 400 });
        }

        updateData.updated_at = new Date().toISOString();

        const result = await supabaseRestPatch(`/rest/v1/vendor_products?id=eq.${id}`, updateData);
        const product = result[0] || result;
        if (product && typeof product === 'object') {
            product.status = product.is_active ? 'Active' : 'Inactive';
        }
        return Response.json({ success: true, product }, { status: 200 });
    } catch (e) {
        console.error('Vendor Products PATCH Error:', e);
        if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
            return Response.json({ success: false, warning: 'Sync failed: Database unreachable' });
        }
        return Response.json({ error: e?.message || 'Failed to update vendor product', details: JSON.stringify(e) }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { vendor_id, name, price, mrp, uom, category_id, image_url } = body;

        if (!vendor_id || !name || !price) {
            return Response.json({ error: 'vendor_id, name, and price are required' }, { status: 400 });
        }

        const productData = {
            vendor_id,
            name: toStr(name),
            price: Number(price),
            mrp: mrp ? Number(mrp) : null,
            online_price: body.online_price ? Number(body.online_price) : null,
            uom: toStr(uom) || null,
            category_id: category_id || null,
            image_url: toStr(image_url) || null,
            description: toStr(body.description) || null,
            is_active: body.status === 'Inactive' ? false : true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await supabaseRestInsert('/rest/v1/vendor_products', [productData]);
        const product = result[0] || result;
        if (product && typeof product === 'object') {
            product.status = product.is_active ? 'Active' : 'Inactive';
        }
        return Response.json({ success: true, product }, { status: 201 });
    } catch (e) {
        console.error('Vendor Products POST Error:', e);
        return Response.json({ error: e?.message || 'Failed to create vendor product', details: JSON.stringify(e) }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = toStr(searchParams.get('id'));

        if (!id) {
            return Response.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

        const url = `${SUPABASE_URL}/rest/v1/vendor_products?id=eq.${id}`;
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
    } catch (e) {
        console.error('Vendor Products DELETE Error:', e);
        return Response.json({ error: e?.message || 'Failed to delete vendor product' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

