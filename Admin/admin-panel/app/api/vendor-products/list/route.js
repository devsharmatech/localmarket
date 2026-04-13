import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

function toStr(v) {
    return typeof v === 'string' ? v.trim() : '';
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const q = toStr(searchParams.get('q'));
        const vendorId = toStr(searchParams.get('vendorId'));
        const categoryId = toStr(searchParams.get('categoryId'));
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build query for vendor_products with vendor name join
        // Using PostgREST foreign key join syntax: select=*,vendors(name)
        const query = new URLSearchParams();
        query.set('select', 'id,name,price,mrp,uom,category_id,vendor_id,updated_at,vendors!inner(name)');
        query.set('order', 'name.asc');
        query.set('limit', limit.toString());
        query.set('offset', offset.toString());

        // Filters
        if (q) {
            query.set('name', `ilike.*${q}*`);
        }
        if (vendorId) {
            query.set('vendor_id', `eq.${vendorId}`);
        }
        if (categoryId) {
            query.set('category_id', `eq.${categoryId}`);
        }

        const rows = await supabaseRestGet(`/rest/v1/vendor_products?${query.toString()}`);
        const products = Array.isArray(rows) ? rows : [];

        // Transform the response to flatten vendor name
        const transformedProducts = products.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            mrp: product.mrp,
            uom: product.uom,
            category_id: product.category_id,
            vendor_id: product.vendor_id,
            vendor_name: product.vendors?.name || 'Unknown Vendor',
            updated_at: product.updated_at,
        }));

        return Response.json({ products: transformedProducts, total: transformedProducts.length }, { status: 200 });
    } catch (e) {
        console.error('Error fetching vendor products:', e);
        // If join fails, try without join and fetch vendor names separately
        try {
            const query = new URLSearchParams();
            query.set('select', 'id,name,price,mrp,uom,category_id,vendor_id,updated_at');
            query.set('order', 'name.asc');
            query.set('limit', limit.toString());
            query.set('offset', offset.toString());

            if (q) {
                query.set('name', `ilike.*${q}*`);
            }
            if (vendorId) {
                query.set('vendor_id', `eq.${vendorId}`);
            }
            if (categoryId) {
                query.set('category_id', `eq.${categoryId}`);
            }

            const rows = await supabaseRestGet(`/rest/v1/vendor_products?${query.toString()}`);
            const products = Array.isArray(rows) ? rows : [];

            // Fetch vendor names separately
            const vendorIds = [...new Set(products.map(p => p.vendor_id).filter(Boolean))];
            const vendorMap = new Map();
            
            if (vendorIds.length > 0) {
                try {
                    const vendorIdsStr = vendorIds.join(',');
                    const vendors = await supabaseRestGet(`/rest/v1/vendors?select=id,name&id=in.(${vendorIdsStr})`);
                    if (Array.isArray(vendors)) {
                        vendors.forEach(v => {
                            if (v.id && v.name) {
                                vendorMap.set(v.id, v.name);
                            }
                        });
                    }
                } catch (vendorError) {
                    console.error('Error fetching vendor names:', vendorError);
                }
            }

            // Transform products with vendor names
            const transformedProducts = products.map(product => ({
                id: product.id,
                name: product.name,
                price: product.price,
                mrp: product.mrp,
                uom: product.uom,
                category_id: product.category_id,
                vendor_id: product.vendor_id,
                vendor_name: vendorMap.get(product.vendor_id) || 'Unknown Vendor',
                updated_at: product.updated_at,
            }));

            return Response.json({ products: transformedProducts, total: transformedProducts.length }, { status: 200 });
        } catch (fallbackError) {
            return Response.json({ error: fallbackError?.message || 'Failed to load vendor products' }, { status: 500 });
        }
    }
}
