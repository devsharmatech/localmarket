import * as XLSX from 'xlsx';
import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const state = searchParams.get('state');
    const city = searchParams.get('city');

    const query = new URLSearchParams();
    query.set('select', '*');
    query.set('order', 'city.asc,name.asc');
    query.set('limit', '10000'); // Export up to 10k vendors
    
    if (status && status !== 'all') {
      query.set('status', `eq.${status}`);
    }
    if (state && state !== 'All') {
      query.set('state', `eq.${state}`);
    }
    if (city && city !== 'All') {
      query.set('city', `eq.${city}`);
    }

    const vendors = await supabaseRestGet(`/rest/v1/vendors?${query.toString()}`);
    const vendorsList = Array.isArray(vendors) ? vendors : [];

    // Format data for export
    const exportData = vendorsList.map(vendor => ({
      'Shop Name': vendor.name || '',
      'Owner Name': vendor.owner || vendor.owner_name || '',
      'Contact Number': vendor.contact_number || '',
      'Email': vendor.email || '',
      'State': vendor.state || '',
      'City': vendor.city || '',
      'Town': vendor.town || '',
      'Tehsil': vendor.tehsil || '',
      'Sub Tehsil': vendor.sub_tehsil || vendor.subTehsil || '',
      'Circle': vendor.circle || '',
      'Category': vendor.category || '',
      'Status': vendor.status || '',
      'KYC Status': vendor.kyc_status || vendor.kycStatus || '',
      'Created At': vendor.created_at ? new Date(vendor.created_at).toLocaleString() : '',
      'Last Active': (vendor.last_active_at || vendor.last_active) ? new Date(vendor.last_active_at || vendor.last_active).toLocaleString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendors');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="vendors_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (e) {
    return Response.json({ error: e?.message || 'Failed to export vendors' }, { status: 500 });
  }
}
