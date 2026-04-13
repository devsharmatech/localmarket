import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

// DELETE /api/themes/[id] - Delete a theme
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 });
    }

    // Check if it's a default theme
    const theme = await supabaseRestGet(`/rest/v1/festival_themes?id=eq.${id}&select=is_default`);
    if (theme && theme[0] && theme[0].is_default) {
      return NextResponse.json({ error: 'Cannot delete default themes' }, { status: 400 });
    }

    // Delete using PATCH to set a deleted flag, or use DELETE if your RLS allows
    // For now, we'll use a direct DELETE (requires proper RLS policy)
    const { supabaseRestWrite } = await import('../../../../lib/supabaseAdminFetch');
    const url = `/rest/v1/festival_themes?id=eq.${id}`;
    const supabaseUrl = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    const res = await fetch(`${supabaseUrl}${url}`, {
      method: 'DELETE',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Delete failed: ${text || res.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting theme:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
