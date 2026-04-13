import { supabaseRestGet, supabaseRestInsert } from '@/lib/supabaseAdminFetch';

function toStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = toStr(searchParams.get('q'));
    const audience = toStr(searchParams.get('audience')); // users | vendors | all
    const limit = Math.min(Number(searchParams.get('limit') || 200), 1000);

    const query = new URLSearchParams();
    query.set('select', '*');
    query.set('order', 'created_at.desc');
    query.set('limit', String(limit));
    if (audience && audience !== 'All') query.set('audience', `eq.${audience}`);
    if (q) query.set('or', `(title.ilike.*${q}*,message.ilike.*${q}*)`);

    const rows = await supabaseRestGet(`/rest/v1/notifications?${query.toString()}`);
    return Response.json({ notifications: Array.isArray(rows) ? rows : [] }, { status: 200 });
  } catch (e) {
    console.error('Notifications GET Error:', e);
    if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
      return Response.json({ notifications: [], warning: 'offline_mode' }, { status: 200 });
    }
    return Response.json({ error: e?.message || 'Failed to load notifications' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const audience = toStr(body?.audience) || 'all';
    const title = toStr(body?.title);
    const message = toStr(body?.message);
    const topic = toStr(body?.topic) || null;

    if (!title || !message) return Response.json({ error: 'title and message are required' }, { status: 400 });

    const inserted = await supabaseRestInsert('/rest/v1/notifications', [
      { audience, title, message, topic, sent_at: new Date().toISOString() },
    ]);
    return Response.json({ notification: Array.isArray(inserted) ? inserted[0] : inserted }, { status: 200 });
  } catch (e) {
    console.error('Notifications POST Error:', e);
    if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
      return Response.json({ notification: null, warning: 'Sync failed: Database unreachable' });
    }
    return Response.json({ error: e?.message || 'Failed to create notification' }, { status: 500 });
  }
}

