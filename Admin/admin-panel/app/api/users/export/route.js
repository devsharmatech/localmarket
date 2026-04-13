import * as XLSX from 'xlsx';
import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const q = searchParams.get('q');

    const query = new URLSearchParams();
    query.set('select', '*');
    query.set('order', 'created_at.desc');
    query.set('limit', '10000'); // Export up to 10k users
    
    if (status && status !== 'all') {
      query.set('status', `eq.${status}`);
    }
    if (q) {
      query.set('or', `(full_name.ilike.*${q}*,email.ilike.*${q}*,phone.ilike.*${q}*)`);
    }

    const users = await supabaseRestGet(`/rest/v1/users?${query.toString()}`);
    const usersList = Array.isArray(users) ? users : [];

    // Format data for export
    const exportData = usersList.map(user => ({
      'Full Name': user.full_name || '',
      'Email': user.email || '',
      'Phone': user.phone || '',
      'State': user.state || '',
      'City': user.city || '',
      'Status': user.status || 'Active',
      'Joined Date': user.created_at ? new Date(user.created_at).toLocaleString() : '',
      'Last Active': user.last_active_at ? new Date(user.last_active_at).toLocaleString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (e) {
    return Response.json({ error: e?.message || 'Failed to export users' }, { status: 500 });
  }
}
