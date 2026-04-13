import { supabaseRestGet, supabaseRestInsert } from '@/lib/supabaseAdminFetch';

// GET - Fetch import history
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Try to fetch from database first (if import_logs table exists)
    try {
      const query = new URLSearchParams();
      query.set('select', '*');
      query.set('order', 'created_at.desc');
      query.set('limit', limit.toString());
      
      const logs = await supabaseRestGet(`/rest/v1/import_logs?${query.toString()}`);
      if (Array.isArray(logs)) {
        return Response.json({ history: logs }, { status: 200 });
      }
    } catch (e) {
      // Table doesn't exist, fall back to localStorage-based approach
      console.warn('Import logs table not found, using fallback:', e.message);
    }

    // Fallback: return empty array (will be populated by POST)
    return Response.json({ history: [] }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e?.message || 'Failed to load import history' }, { status: 500 });
  }
}

// POST - Log an import
export async function POST(req) {
  try {
    const body = await req.json();
    const { filename, inserted, updated, total, status, error } = body;

    const logEntry = {
      filename: filename || 'unknown.xlsx',
      inserted: inserted || 0,
      updated: updated || 0,
      total: total || 0,
      status: status || 'success',
      error: error || null,
      created_at: new Date().toISOString(),
    };

    // Try to insert into database first
    try {
      const result = await supabaseRestInsert('/rest/v1/import_logs', [logEntry]);
      return Response.json({ success: true, log: result[0] || result }, { status: 201 });
    } catch (e) {
      // Table doesn't exist, that's okay - we'll use localStorage fallback in frontend
      console.warn('Could not save import log to database:', e.message);
      return Response.json({ success: true, log: logEntry }, { status: 201 });
    }
  } catch (e) {
    return Response.json({ error: e?.message || 'Failed to log import' }, { status: 500 });
  }
}
