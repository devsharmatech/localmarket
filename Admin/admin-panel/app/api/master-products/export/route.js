import * as XLSX from 'xlsx';
import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get('categoryId');
        const q = searchParams.get('q');

        const query = new URLSearchParams();
        query.set('select', 'id,name,brand,uom,default_mrp,category_id,image_url,created_at');
        query.set('order', 'name.asc');
        query.set('limit', '10000'); // Export up to 10k products

        if (q) {
            query.set('name', `ilike.*${q}*`);
        }
        if (categoryId) {
            query.set('category_id', `eq.${categoryId}`);
        }

        const products = await supabaseRestGet(`/rest/v1/master_products?${query.toString()}`);
        const productsList = Array.isArray(products) ? products : [];

        // Get categories for mapping category_id to name
        const categories = await supabaseRestGet('/rest/v1/categories?select=id,name').catch(() => []);
        const categoryMap = new Map();
        if (Array.isArray(categories)) {
            categories.forEach(cat => {
                if (cat.id && cat.name) {
                    categoryMap.set(cat.id, cat.name);
                }
            });
        }

        // Format data for export
        const exportData = productsList.map(product => ({
            'Product Name': product.name || '',
            'Brand': product.brand || '',
            'Category': product.category_id ? (categoryMap.get(product.category_id) || product.category_id) : '',
            'UOM': product.uom || '',
            'Default MRP': product.default_mrp || '',
            'Image URL': product.image_url || '',
            'Category ID': product.category_id || '',
            'Created At': product.created_at ? new Date(product.created_at).toLocaleString() : '',
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="products_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
            },
        });
    } catch (e) {
        return Response.json({ error: e?.message || 'Failed to export products' }, { status: 500 });
    }
}
