import * as XLSX from 'xlsx';
import { supabaseRestGet, supabaseRestInsert, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

function toStr(v) {
    return typeof v === 'string' ? v.trim() : '';
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
            const fullName = toStr(r['Full Name'] ?? r['full_name'] ?? r['Name'] ?? r['name'] ?? r['Full Name']);
            const email = toStr(r['Email'] ?? r['email']);
            const phone = toStr(r['Phone'] ?? r['phone'] ?? r['Contact Number'] ?? r['contact_number']);
            const state = toStr(r['State'] ?? r['state']);
            const city = toStr(r['City'] ?? r['city']);
            const status = toStr(r['Status'] ?? r['status'] ?? 'Active');

            if (!fullName) {
                errors.push({ row: rowNo, error: 'Full Name is required' });
                return;
            }
            if (!phone) {
                errors.push({ row: rowNo, error: 'Phone Number is required' });
                return;
            }

            // Validate phone format (basic check)
            const phoneRegex = /^[0-9]{10}$/;
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            if (cleanPhone.length !== 10) {
                errors.push({ row: rowNo, error: 'Phone number must be 10 digits' });
                return;
            }

            // Validate status
            const validStatuses = ['Active', 'Blocked', 'Pending'];
            const finalStatus = validStatuses.includes(status) ? status : 'Active';

            // Validate email format if provided
            if (email && !email.includes('@')) {
                errors.push({ row: rowNo, error: 'Invalid email format' });
                return;
            }

            const userData = {
                full_name: fullName,
                email: email || null,
                phone: cleanPhone,
                state: state || null,
                city: city || null,
                status: finalStatus,
            };

            payload.push(userData);
        });

        if (payload.length === 0) {
            return Response.json({ error: 'No rows found in file' }, { status: 400 });
        }

        if (errors.length) {
            return Response.json({ success: false, errors, inserted: 0 }, { status: 400 });
        }

        // Get existing users to check for duplicates (by phone)
        const existingUsers = new Map();
        try {
            const existing = await supabaseRestGet('/rest/v1/users?select=id,phone');
            if (Array.isArray(existing)) {
                existing.forEach(user => {
                    existingUsers.set(user.phone, user.id);
                });
            }
        } catch (e) {
            console.warn('Could not fetch existing users:', e.message);
        }

        // Separate into inserts and updates
        const toInsert = [];
        const toUpdate = [];

        payload.forEach(user => {
            const existingId = existingUsers.get(user.phone);

            if (existingId) {
                toUpdate.push({ ...user, id: existingId });
            } else {
                toInsert.push(user);
            }
        });

        let insertedCount = 0;
        let updatedCount = 0;

        // Insert new users
        if (toInsert.length > 0) {
            try {
                const insertResult = await supabaseRestInsert('/rest/v1/users', toInsert);
                insertedCount = Array.isArray(insertResult) ? insertResult.length : (insertResult ? 1 : 0);
            } catch (e) {
                console.error('Error inserting users:', e);
                return Response.json({
                    success: false,
                    error: `Failed to insert users: ${e.message}`,
                    inserted: 0,
                    updated: 0,
                    errors: [{ message: e.message }]
                }, { status: 500 });
            }
        }

        // Update existing users
        if (toUpdate.length > 0) {
            try {
                for (const user of toUpdate) {
                    const { id, ...updateData } = user;
                    await supabaseRestPatch(`/rest/v1/users?id=eq.${id}`, updateData);
                    updatedCount++;
                }
            } catch (e) {
                console.error('Error updating users:', e);
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
