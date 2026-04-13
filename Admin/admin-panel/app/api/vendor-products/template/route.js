import * as XLSX from 'xlsx';
import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

function toStr(v) {
    return typeof v === 'string' ? v : '';
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const vendorId = toStr(searchParams.get('vendorId'));
        if (!vendorId) {
            return Response.json({ error: 'vendorId is required' }, { status: 400 });
        }

        const query = new URLSearchParams();
        query.set('select', 'id,name,price,mrp,uom,category_id');
        query.set('vendor_id', `eq.${vendorId}`);
        query.set('order', 'name.asc');

        const rows = await supabaseRestGet(`/rest/v1/vendor_products?${query.toString()}`);
        const data = Array.isArray(rows) ? rows : [];

        const templateRows = data.map((p) => ({
            'Vendor Product ID': p.id,
            'Product Name': p.name,
            'Current Price': p.price ?? '',
            'New Price': '',
            'MRP (optional)': p.mrp ?? '',
            UOM: p.uom ?? '',
            'Category ID': p.category_id ?? '',
        }));

        const ws = XLSX.utils.json_to_sheet(templateRows.length ? templateRows : [{
            'Vendor Product ID': '',
            'Product Name': '',
            'Current Price': '',
            'New Price': '',
            'MRP (optional)': '',
            UOM: '',
            'Category ID': '',
        }]);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Bulk Price Update');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="vendor_price_update_template.xlsx"',
            },
        });
    } catch (e) {
        return Response.json({ error: e?.message || 'Failed to create template' }, { status: 500 });
    }
}

