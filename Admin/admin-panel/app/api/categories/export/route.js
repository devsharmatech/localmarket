import * as XLSX from 'xlsx';
import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

export async function GET() {
  try {
    const categories = await supabaseRestGet('/rest/v1/categories?select=*&order=priority.asc');
    const categoriesList = Array.isArray(categories) ? categories : [];

    // Format data for export
    const exportData = categoriesList.map(category => ({
      'Category Name': category.name || '',
      'Category ID': category.id || '',
      'Priority': category.priority ?? 999,
      'Visible': category.visible !== false,
      'Icon Name': category.icon_name || '',
      'Icon URL': category.icon_url || '',
      'Created At': category.created_at ? new Date(category.created_at).toLocaleString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categories');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="categories_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (e) {
    return Response.json({ error: e?.message || 'Failed to export categories' }, { status: 500 });
  }
}
