import { supabaseRestGet, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json({ error: 'Request body is required' }, { status: 400 });
    }

    const { userId, currentPassword, newPassword } = body;

    if (!userId || !currentPassword || !newPassword) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch current user from DB
    const users = await supabaseRestGet(`/rest/v1/users?id=eq.${encodeURIComponent(userId)}&limit=1`);
    
    if (!Array.isArray(users) || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // 2. Verify current password
    // NOTE: Using plain text comparison as per the existing login logic.
    // TODO: Move to bcrypt hashing for better security.
    if (user.password !== currentPassword) {
      return Response.json({ error: 'Invalid current password' }, { status: 401 });
    }

    // 3. Update password in DB
    const result = await supabaseRestPatch(
      `/rest/v1/users?id=eq.${encodeURIComponent(userId)}`,
      { password: newPassword }
    );

    return Response.json({
      success: true,
      message: 'Password updated successfully'
    }, { status: 200 });

  } catch (e) {
    console.error('Change password error:', e);
    return Response.json({ error: e?.message || 'Failed to update password' }, { status: 500 });
  }
}
