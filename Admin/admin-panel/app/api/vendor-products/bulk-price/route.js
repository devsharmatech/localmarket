import * as XLSX from 'xlsx';
import { supabaseRestUpsert, supabaseRestInsert } from '@/lib/supabaseAdminFetch';

function toStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function toNum(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const vendorId = toStr(form.get('vendorId'));

    if (!vendorId) return Response.json({ error: 'vendorId is required' }, { status: 400 });
    if (!file || typeof file.arrayBuffer !== 'function') {
      return Response.json({ error: 'Missing file' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const errors = [];
    const updates = [];

    rows.forEach((r, idx) => {
      const rowNo = idx + 2;
      const id = toStr(r['Vendor Product ID'] ?? r['vendor_product_id'] ?? r['id']);
      const newPrice = toNum(r['New Price'] ?? r['new_price'] ?? r['price']);
      const mrp = toNum(r['MRP (optional)'] ?? r['mrp']);

      if (!id) {
        errors.push({ row: rowNo, error: 'Vendor Product ID is required' });
        return;
      }
      if (newPrice === null || newPrice <= 0) {
        errors.push({ row: rowNo, error: 'New Price must be a number > 0' });
        return;
      }

      updates.push({
        id,
        vendor_id: vendorId,
        price: newPrice,
        mrp,
        updated_at: new Date().toISOString(),
      });
    });

    if (!updates.length) {
      return Response.json({ error: 'No valid rows found' }, { status: 400 });
    }
    if (errors.length) {
      return Response.json({ success: false, updated: 0, errors }, { status: 400 });
    }

    // Upsert by id (merge-duplicates)
    await supabaseRestUpsert('/rest/v1/vendor_products?on_conflict=id', updates);

    // Log update for idle-vendor notifications, etc.
    await supabaseRestInsert('/rest/v1/price_update_logs', [
      { vendor_id: vendorId, updated_count: updates.length, source: 'excel' },
    ]);

    return Response.json({ success: true, updated: updates.length, errors: [] }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e?.message || 'Bulk price update failed' }, { status: 500 });
  }
}

