import { supabaseRestGet, supabaseRestUpsert } from '@/lib/supabaseAdminFetch';

function toStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export async function GET() {
  try {
    const query = new URLSearchParams();
    query.set('select', '*');
    query.set('order', 'key.asc');
    const rows = await supabaseRestGet(`/rest/v1/auto_notification_settings?${query.toString()}`);
    return Response.json({ settings: Array.isArray(rows) ? rows : [] }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e?.message || 'Failed to load auto notification settings' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json().catch(() => null);
    const key = toStr(body?.key);
    const enabled = body?.enabled;
    const config = body?.config ?? null;
    if (!key) return Response.json({ error: 'key is required' }, { status: 400 });

    const rows = await supabaseRestUpsert('/rest/v1/auto_notification_settings?on_conflict=key', [
      {
        key,
        enabled: typeof enabled === 'boolean' ? enabled : true,
        config: config ?? {},
        updated_at: new Date().toISOString(),
      },
    ]);
    return Response.json({ setting: Array.isArray(rows) ? rows[0] : rows }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e?.message || 'Failed to update auto notification settings' }, { status: 500 });
  }
}

