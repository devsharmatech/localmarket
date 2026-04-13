import * as XLSX from 'xlsx';
import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestInsert } from '@/lib/supabaseAdminFetch';

function toStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const errors = [];
    const payload = [];
    const seen = new Set(); // Track duplicates within the file

    rows.forEach((r, idx) => {
      const rowNo = idx + 2; // header row = 1
      const state = toStr(r['State'] ?? r['state']);
      const city = toStr(r['City'] ?? r['city']);
      const town = toStr(r['Town'] ?? r['town']);
      const tehsil = toStr(r['Tehsil'] ?? r['tehsil']);
      const subTehsil = toStr(r['Sub-Tehsil'] ?? r['Sub Tehsil'] ?? r['sub_tehsil'] ?? r['subTehsil'] ?? r['SubTehsil']);
      const circle = toStr(r['Circle'] ?? r['circle']) || null;

      // Validate required fields
      if (!state) {
        errors.push({ row: rowNo, error: 'State is required' });
        return;
      }
      if (!city) {
        errors.push({ row: rowNo, error: 'City is required' });
        return;
      }
      if (!town) {
        errors.push({ row: rowNo, error: 'Town is required' });
        return;
      }
      if (!tehsil) {
        errors.push({ row: rowNo, error: 'Tehsil is required' });
        return;
      }
      if (!subTehsil) {
        errors.push({ row: rowNo, error: 'Sub-Tehsil is required' });
        return;
      }

      // Check for duplicates within the file
      const key = `${state}::${city}::${town}::${tehsil}::${subTehsil}`;
      if (seen.has(key)) {
        errors.push({ row: rowNo, error: 'Duplicate location in file' });
        return;
      }
      seen.add(key);

      payload.push({
        state,
        city,
        town,
        tehsil,
        sub_tehsil: subTehsil,
        circle,
      });
    });

    if (payload.length === 0) {
      return NextResponse.json({ error: 'No valid rows found in file' }, { status: 400 });
    }

    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors, inserted: 0 }, { status: 400 });
    }

    // Get existing locations to avoid duplicates
    const existingKeys = new Set();
    try {
      const existingLocations = await supabaseRestGet('/rest/v1/locations?select=state,city,town,tehsil,sub_tehsil');
      if (Array.isArray(existingLocations)) {
        existingLocations.forEach(loc => {
          const key = `${loc.state}::${loc.city}::${loc.town}::${loc.tehsil}::${loc.sub_tehsil}`;
          existingKeys.add(key);
        });
      }
    } catch (e) {
      console.warn('Could not fetch existing locations:', e.message);
      // If table doesn't exist, provide helpful error message
      if (e.message && (e.message.includes('does not exist') || e.message.includes('relation') || e.message.includes('PGRST205'))) {
        return NextResponse.json(
          { 
            success: false,
            error: 'The locations table does not exist in Supabase. Please run the SQL script: sql/create_locations_table.sql',
            inserted: 0,
          },
          { status: 500 }
        );
      }
    }

    // Filter out locations that already exist
    const toInsert = payload.filter(loc => {
      const key = `${loc.state}::${loc.city}::${loc.town}::${loc.tehsil}::${loc.sub_tehsil}`;
      return !existingKeys.has(key);
    });

    let insertedCount = 0;
    const skippedCount = payload.length - toInsert.length;

    // Insert new locations in batches
    if (toInsert.length > 0) {
      try {
        // Insert in batches of 100 to avoid overwhelming the API
        const batchSize = 100;
        for (let i = 0; i < toInsert.length; i += batchSize) {
          const batch = toInsert.slice(i, i + batchSize);
          const insertResult = await supabaseRestInsert('/rest/v1/locations', batch);
          insertedCount += Array.isArray(insertResult) ? insertResult.length : (insertResult ? 1 : 0);
        }
      } catch (e) {
        console.error('Error inserting locations:', e);
        let errorMessage = e?.message || 'Failed to insert locations';
        
        // Provide helpful error message if table doesn't exist
        if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('PGRST205')) {
          errorMessage = 'The locations table does not exist in Supabase. Please run the SQL script: sql/create_locations_table.sql';
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: errorMessage,
            inserted: insertedCount,
            skipped: skippedCount,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      skipped: skippedCount,
      total: payload.length,
      message: `Imported ${insertedCount} new locations${skippedCount > 0 ? `, skipped ${skippedCount} duplicates` : ''}`,
    });
  } catch (error) {
    console.error('Error importing locations:', error);
    let errorMessage = error?.message || 'Failed to import locations';
    
    // Provide helpful error message if table doesn't exist
    if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('PGRST205')) {
      errorMessage = 'The locations table does not exist in Supabase. Please run the SQL script: sql/create_locations_table.sql';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
