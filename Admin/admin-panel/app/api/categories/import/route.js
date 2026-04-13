import * as XLSX from 'xlsx';
import { supabaseRestGet, supabaseRestInsert, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

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

        if (!file || typeof file.arrayBuffer !== 'function') {
            return Response.json({ error: 'Missing file' }, { status: 400 });
        }

        const buf = Buffer.from(await file.arrayBuffer());
        const wb = XLSX.read(buf, { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const errors = [];
        const payload = [];

        rows.forEach((r, idx) => {
            const rowNo = idx + 2; // header row = 1
            const name = toStr(r['Category Name'] ?? r['name'] ?? r['Name'] ?? r['Category']);
            const priority = toNum(r['Priority'] ?? r['priority'] ?? r['Sort Order'] ?? r['sort_order']);
            const visible = r['Visible'] ?? r['visible'] ?? r['Is Visible'] ?? r['is_visible'];
            const iconName = toStr(r['Icon Name'] ?? r['icon_name'] ?? r['Icon'] ?? r['icon']);
            const iconUrl = toStr(r['Icon URL'] ?? r['icon_url'] ?? r['Icon URL'] ?? r['iconUrl'] ?? '');

            if (!name) {
                errors.push({ row: rowNo, error: 'Category Name is required' });
                return;
            }

            // Note: categories table uses UUID primary key, so we don't set id
            // We'll match by name to check if category exists
            const categoryData = {
                name,
                icon_name: iconName || null,
                icon_url: iconUrl || null,
                priority: priority ?? 999,
                visible: visible === false || visible === 'false' || visible === 'FALSE' ? false : true,
            };

            payload.push(categoryData);
        });

        if (payload.length === 0) {
            return Response.json({ error: 'No valid rows found in file' }, { status: 400 });
        }

        if (errors.length > 0) {
            return Response.json({ success: false, errors, inserted: 0 }, { status: 400 });
        }

        // Get existing categories to check which ones need to be updated vs inserted
        // Match by name since id is UUID and auto-generated
        const existingNames = new Set();
        try {
            const existingCategories = await supabaseRestGet('/rest/v1/categories?select=id,name');
            if (Array.isArray(existingCategories)) {
                existingCategories.forEach(cat => existingNames.add(cat.name.toLowerCase().trim()));
            }
        } catch (e) {
            // If we can't fetch existing, proceed with inserts only
            console.warn('Could not fetch existing categories:', e.message);
        }

        // Separate into inserts and updates
        const toInsert = [];
        const toUpdate = [];

        payload.forEach(cat => {
            const normalizedName = cat.name.toLowerCase().trim();
            if (existingNames.has(normalizedName)) {
                toUpdate.push(cat);
            } else {
                toInsert.push(cat);
            }
        });

        let insertedCount = 0;
        let updatedCount = 0;

        // Insert new categories
        if (toInsert.length > 0) {
            try {
                const insertResult = await supabaseRestInsert('/rest/v1/categories', toInsert);
                insertedCount = Array.isArray(insertResult) ? insertResult.length : (insertResult ? 1 : 0);
            } catch (e) {
                console.error('Error inserting categories:', e);
                // Continue with updates even if inserts fail
            }
        }

        // Update existing categories
        if (toUpdate.length > 0) {
            try {
                // Update each category individually by name since we don't have UUID
                for (const cat of toUpdate) {
                    const { name, ...updateData } = cat;
                    await supabaseRestPatch(`/rest/v1/categories?name=eq.${encodeURIComponent(name)}`, updateData);
                    updatedCount++;
                }
            } catch (e) {
                console.error('Error updating categories:', e);
                // Return partial success
            }
        }

        return Response.json({
            success: true,
            inserted: insertedCount,
            updated: updatedCount,
            total: insertedCount + updatedCount,
            errors: [],
        });
    } catch (e) {
        return Response.json({ error: e?.message || 'Import failed' }, { status: 500 });
    }
}
