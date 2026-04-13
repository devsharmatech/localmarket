import { supabaseRestGet, assertSupabaseEnv } from '@/lib/supabaseAdminFetch';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function toStr(v) {
  return typeof v === 'string' ? v : '';
}

function normalizeFeedback(f) {
  return {
    id: f.id ?? f.feedback_id ?? f.feedbackId,
    type: f.type ?? 'user', // user | vendor
    userId: f.userId ?? f.user_id ?? null,
    userName: f.userName ?? f.user_name ?? null,
    vendorId: f.vendorId ?? f.vendor_id ?? null,
    vendorName: f.vendorName ?? f.vendor_name ?? null,
    category: f.category ?? 'General',
    rating: f.rating ?? 0,
    comment: f.comment ?? '',
    status: f.status ?? 'pending',
    createdAt: f.createdAt ?? f.created_at ?? null,
    location: f.location ?? null,
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = toStr(searchParams.get('q'));
    const type = toStr(searchParams.get('type')); // user | vendor
    const status = toStr(searchParams.get('status')); // pending | reviewed | resolved

    const query = new URLSearchParams();
    query.set('select', '*');
    query.set('order', 'created_at.desc');
    if (type && type !== 'all') query.set('type', `eq.${type}`);
    if (status && status !== 'all') query.set('status', `eq.${status}`);
    if (q) {
      query.set('or', `(comment.ilike.*${q}*,userName.ilike.*${q}*,vendorName.ilike.*${q}*)`);
    }

    const rows = await supabaseRestGet(`/rest/v1/feedback?${query.toString()}`);
    const feedback = Array.isArray(rows) ? rows.map(normalizeFeedback) : [];
    return Response.json({ feedback }, { status: 200 });
  } catch (e) {
    const errorMessage = e?.message || 'Failed to load feedback';
    console.error('Error loading feedback:', errorMessage);
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND')) {
      return Response.json({ feedback: [], warning: 'offline_mode' }, { status: 200 });
    }
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    assertSupabaseEnv();
    const body = await req.json().catch(() => null);
    const id = body?.id;
    const status = body?.status;
    if (!id || !status) {
      return Response.json({ error: 'id and status are required' }, { status: 400 });
    }

    // Patch via PostgREST
    const url = `${SUPABASE_URL}/rest/v1/feedback?id=eq.${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Supabase REST error (${res.status}): ${text || res.statusText}`);
    }
    const rows = await res.json().catch(() => []);
    const updated = Array.isArray(rows) && rows[0] ? normalizeFeedback(rows[0]) : null;
    return Response.json({ feedback: updated }, { status: 200 });
  } catch (e) {
    const errorMessage = e?.message || 'Failed to update feedback';
    console.error('Error updating feedback:', errorMessage);
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND')) {
      return Response.json({ success: false, warning: 'Sync failed: Database unreachable' });
    }
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

