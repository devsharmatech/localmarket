import { supabaseRestGet, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

function toStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function normalizeUser(u) {
  return {
    id: u.id ?? u.user_id ?? u.userId,
    name: u.full_name ?? u.name ?? '',
    email: u.email ?? '',
    phone: u.phone ?? '',
    state: u.state ?? '',
    city: u.city ?? '',
    status: u.status ?? 'Active',
    joinedDate: u.created_at ?? u.joinedDate ?? '',
    lastActiveAt: u.last_active_at ?? u.lastActiveAt ?? null,
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = toStr(searchParams.get('q'));
    const status = toStr(searchParams.get('status')); // Active | Blocked | Pending | all
    const state = toStr(searchParams.get('state'));
    const city = toStr(searchParams.get('city'));
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(Math.max(10, Number(searchParams.get('limit') || 20)), 100);
    const offset = (page - 1) * limit;

    // Build base query for filtering
    const baseQuery = new URLSearchParams();
    baseQuery.set('select', '*');
    baseQuery.set('order', 'created_at.desc');

    if (status && status !== 'all') baseQuery.set('status', `eq.${status}`);
    if (state && state !== 'All') baseQuery.set('state', `eq.${state}`);
    if (city && city !== 'All') baseQuery.set('city', `eq.${city}`);
    if (q) {
      baseQuery.set('or', `(full_name.ilike.*${q}*,email.ilike.*${q}*,phone.ilike.*${q}*)`);
    }

    // Get total count for pagination
    const countQuery = new URLSearchParams(baseQuery);
    countQuery.set('select', 'id');
    let totalCount = 0;
    try {
      const countRows = await supabaseRestGet(`/rest/v1/users?${countQuery.toString()}`);
      totalCount = Array.isArray(countRows) ? countRows.length : 0;
    } catch (e) {
      console.error('Error getting user count:', e);
    }

    // Get paginated results
    const dataQuery = new URLSearchParams(baseQuery);
    dataQuery.set('limit', String(limit));
    dataQuery.set('offset', String(offset));

    const rows = await supabaseRestGet(`/rest/v1/users?${dataQuery.toString()}`);
    const users = Array.isArray(rows) ? rows.map(normalizeUser) : [];

    return Response.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    }, { status: 200 });
  } catch (e) {
    console.error('Users GET Error:', e);
    if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
      return Response.json({
        users: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        warning: 'offline_mode'
      }, { status: 200 });
    }
    return Response.json({ error: e?.message || 'Failed to load users' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json().catch(() => null);
    const id = toStr(body?.id);
    const status = toStr(body?.status);
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
    if (!status && !body?.full_name && !body?.email && !body?.phone && !body?.state && !body?.city && !body?.selected_theme && !body?.theme) {
      return Response.json({ error: 'At least one field to update is required' }, { status: 400 });
    }

    const patch = {};
    if (status) patch.status = status;
    if (body?.full_name !== undefined) patch.full_name = toStr(body.full_name);
    if (body?.name !== undefined) patch.full_name = toStr(body.name);
    if (body?.email !== undefined) patch.email = toStr(body.email) || null;
    if (body?.phone !== undefined) patch.phone = toStr(body.phone);
    if (body?.state !== undefined) patch.state = toStr(body.state) || null;
    if (body?.city !== undefined) patch.city = toStr(body.city) || null;
    if (body?.selected_theme !== undefined) patch.selected_theme = toStr(body.selected_theme) || null;
    if (body?.theme !== undefined) patch.selected_theme = toStr(body.theme) || null; // Support 'theme' as alias

    const updated = await supabaseRestPatch(`/rest/v1/users?id=eq.${encodeURIComponent(id)}`, patch);
    const user = Array.isArray(updated) && updated[0] ? normalizeUser(updated[0]) : null;
    return Response.json({ user }, { status: 200 });
  } catch (e) {
    console.error('User PATCH Error:', e);
    if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
      return Response.json({ user: null, warning: 'Sync failed: Database unreachable' });
    }
    return Response.json({ error: e?.message || 'Failed to update user' }, { status: 500 });
  }
}

