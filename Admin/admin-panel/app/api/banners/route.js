import { supabaseRestGet, supabaseRestInsert, supabaseRestPatch, supabaseRestDelete } from '@/lib/supabaseAdminFetch';

function toStr(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

export async function GET() {
  try {
    const query = new URLSearchParams();
    query.set('select', '*');
    query.set('order', 'sort_order.asc,created_at.desc');
    const rows = await supabaseRestGet(`/rest/v1/banners?${query.toString()}`);
    return Response.json({ banners: Array.isArray(rows) ? rows : [] }, { status: 200 });
  } catch (e) {
    const errorMessage = e?.message || 'Failed to load banners';
    console.error('Error loading banners:', errorMessage);
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND')) {
      return Response.json({ banners: [], warning: 'offline_mode' }, { status: 200 });
    }
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    const title = toStr(body?.title) || null;
    const image_url = toStr(body?.image_url || body?.imageUrl);
    const link_url = toStr(body?.link_url || body?.linkUrl) || null;
    const active = typeof body?.active === 'boolean' ? body.active : true;
    const sort_order = Number.isFinite(Number(body?.sort_order)) ? Number(body.sort_order) : 0;
    const start_at = body?.start_at || body?.startAt || null;
    const end_at = body?.end_at || body?.endAt || null;
    const target_city = toStr(body?.target_city || body?.targetCity) || null;
    const target_circle = toStr(body?.target_circle || body?.targetCircle) || null;

    if (!image_url) return Response.json({ error: 'image_url is required' }, { status: 400 });

    const inserted = await supabaseRestInsert('/rest/v1/banners', [
      { title, image_url, link_url, active, sort_order, start_at, end_at, target_city, target_circle },
    ]);
    return Response.json({ banner: Array.isArray(inserted) ? inserted[0] : inserted }, { status: 200 });
  } catch (e) {
    const errorMessage = e?.message || 'Failed to create banner';
    console.error('Error creating banner:', errorMessage);
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND')) {
      return Response.json({ success: false, warning: 'Sync failed: Database unreachable' });
    }
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json().catch(() => null);
    const id = toStr(body?.id);
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

    const patch = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.image_url !== undefined || body.imageUrl !== undefined) patch.image_url = body.image_url || body.imageUrl;
    if (body.link_url !== undefined || body.linkUrl !== undefined) patch.link_url = body.link_url || body.linkUrl;
    if (body.active !== undefined) patch.active = body.active;
    if (body.sort_order !== undefined) patch.sort_order = body.sort_order;
    if (body.start_at !== undefined || body.startAt !== undefined) patch.start_at = body.start_at || body.startAt;
    if (body.end_at !== undefined || body.endAt !== undefined) patch.end_at = body.end_at || body.endAt;
    if (body.target_city !== undefined || body.targetCity !== undefined) patch.target_city = body.target_city || body.targetCity;
    if (body.target_circle !== undefined || body.targetCircle !== undefined) patch.target_circle = body.target_circle || body.targetCircle;

    const updated = await supabaseRestPatch(`/rest/v1/banners?id=eq.${encodeURIComponent(id)}`, patch);
    return Response.json({ banner: Array.isArray(updated) ? updated[0] : updated }, { status: 200 });
  } catch (e) {
    const errorMessage = e?.message || 'Failed to update banner';
    console.error('Error updating banner:', errorMessage);
    if (errorMessage.includes('fetch failed') || errorMessage.includes('ENOTFOUND')) {
      return Response.json({ success: false, warning: 'Sync failed: Database unreachable' });
    }
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

    await supabaseRestDelete(`/rest/v1/banners?id=eq.${encodeURIComponent(id)}`);
    return Response.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error('Error deleting banner:', e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

