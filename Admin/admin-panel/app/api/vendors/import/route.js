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
            const name = toStr(r['Shop Name'] ?? r['name'] ?? r['Name'] ?? r['Shop'] ?? r['shop_name']);
            const ownerName = toStr(r['Owner Name'] ?? r['owner_name'] ?? r['Owner'] ?? r['owner'] ?? r['ownerName']);
            const contactNumber = toStr(r['Contact Number'] ?? r['contact_number'] ?? r['Contact'] ?? r['contact'] ?? r['phone'] ?? r['Phone']);
            const email = toStr(r['Email'] ?? r['email']);
            const state = toStr(r['State'] ?? r['state']);
            const city = toStr(r['City'] ?? r['city']);
            const town = toStr(r['Town'] ?? r['town']);
            const tehsil = toStr(r['Tehsil'] ?? r['tehsil']);
            const subTehsil = toStr(r['Sub Tehsil'] ?? r['sub_tehsil'] ?? r['Sub Tehsil'] ?? r['SubTehsil']);
            const circle = toStr(r['Circle'] ?? r['circle']);
            const category = toStr(r['Category'] ?? r['category']);
            const status = toStr(r['Status'] ?? r['status'] ?? 'Pending');
            const kycStatus = toStr(r['KYC Status'] ?? r['kyc_status'] ?? r['KYCStatus'] ?? 'Pending');
            const address = toStr(r['Address'] ?? r['address']);
            const landmark = toStr(r['Landmark'] ?? r['landmark']);
            const pincode = toStr(r['Pincode'] ?? r['pincode'] ?? r['Pin Code'] ?? r['pin_code']);

            if (!name) {
                errors.push({ row: rowNo, error: 'Shop Name is required' });
                return;
            }
            if (!contactNumber) {
                errors.push({ row: rowNo, error: 'Contact Number is required' });
                return;
            }

            // Validate status
            const validStatuses = ['Active', 'Pending', 'Blocked', 'Inactive'];
            const finalStatus = validStatuses.includes(status) ? status : 'Pending';

            // Validate KYC status
            const validKycStatuses = ['Pending', 'Approved', 'Rejected', 'Verified'];
            const finalKycStatus = validKycStatuses.includes(kycStatus) ? kycStatus : 'Pending';

            const vendorData = {
                name,
                owner: ownerName || null,
                owner_name: ownerName || null,
                contact_number: contactNumber,
                email: email || null,
                state: state || null,
                city: city || null,
                town: town || null,
                tehsil: tehsil || null,
                sub_tehsil: subTehsil || null,
                circle: circle || null,
                category: category || null,
                status: finalStatus,
                kyc_status: finalKycStatus,
                address: address || null,
                landmark: landmark || null,
                pincode: pincode || null,
            };

            payload.push(vendorData);
        });

        if (payload.length === 0) {
            return Response.json({ error: 'No rows found in file' }, { status: 400 });
        }

        if (errors.length) {
            return Response.json({ success: false, errors, inserted: 0 }, { status: 400 });
        }

        // Get existing vendors to check for duplicates (by contact_number or name)
        const existingVendors = new Map();
        try {
            const existing = await supabaseRestGet('/rest/v1/vendors?select=id,name,contact_number');
            if (Array.isArray(existing)) {
                existing.forEach(vendor => {
                    const key = `${vendor.contact_number || ''}_${vendor.name?.toLowerCase().trim() || ''}`;
                    existingVendors.set(key, vendor.id);
                });
            }
        } catch (e) {
            console.warn('Could not fetch existing vendors:', e.message);
        }

        // Separate into inserts and updates
        const toInsert = [];
        const toUpdate = [];

        payload.forEach(vendor => {
            const key = `${vendor.contact_number || ''}_${vendor.name?.toLowerCase().trim() || ''}`;
            const existingId = existingVendors.get(key);

            if (existingId) {
                toUpdate.push({ ...vendor, id: existingId });
            } else {
                toInsert.push(vendor);
            }
        });

        let insertedCount = 0;
        let updatedCount = 0;

        // Insert new vendors
        if (toInsert.length > 0) {
            try {
                const insertResult = await supabaseRestInsert('/rest/v1/vendors', toInsert);
                insertedCount = Array.isArray(insertResult) ? insertResult.length : (insertResult ? 1 : 0);
            } catch (e) {
                console.error('Error inserting vendors:', e);
                return Response.json({
                    success: false,
                    error: `Failed to insert vendors: ${e.message}`,
                    inserted: 0,
                    updated: 0,
                    errors: [{ message: e.message }]
                }, { status: 500 });
            }
        }

        // Update existing vendors
        if (toUpdate.length > 0) {
            try {
                for (const vendor of toUpdate) {
                    const { id, ...updateData } = vendor;
                    await supabaseRestPatch(`/rest/v1/vendors?id=eq.${id}`, updateData);
                    updatedCount++;
                }
            } catch (e) {
                console.error('Error updating vendors:', e);
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
