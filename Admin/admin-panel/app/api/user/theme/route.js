import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

/**
 * PATCH /api/user/theme - Update user's selected theme
 * Body: { userId, phone, email, theme }
 */
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { userId, phone, email, theme } = body;

    // Clean up values - remove null, undefined, empty strings
    const cleanUserId = userId && userId.trim() ? userId.trim() : null;
    const cleanPhone = phone && phone.trim() ? phone.trim() : null;
    const cleanEmail = email && email.trim() ? email.trim() : null;

    // Validate that at least one identifier is provided
    if (!cleanUserId && !cleanPhone && !cleanEmail) {
      return NextResponse.json(
        { error: 'At least one of userId, phone, or email is required' },
        { status: 400 }
      );
    }

    // Validate theme is provided
    if (!theme || !theme.trim()) {
      return NextResponse.json(
        { error: 'Theme ID is required' },
        { status: 400 }
      );
    }

    const themeId = theme.trim();

    // Build query to find user - prioritize userId, then phone, then email
    let userQuery = '/rest/v1/users?select=id';
    
    if (cleanUserId) {
      userQuery += `&id=eq.${encodeURIComponent(cleanUserId)}`;
    } else if (cleanPhone) {
      userQuery += `&phone=eq.${encodeURIComponent(cleanPhone)}`;
    } else if (cleanEmail) {
      userQuery += `&email=eq.${encodeURIComponent(cleanEmail)}`;
    }

    console.log('Finding user with query:', userQuery);

    // Find the user
    const users = await supabaseRestGet(userQuery);
    
    if (!users || (Array.isArray(users) && users.length === 0)) {
      console.error('User not found with query:', userQuery);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the first matching user
    const user = Array.isArray(users) ? users[0] : users;
    const userIdToUpdate = user.id;

    console.log('Updating theme for user:', userIdToUpdate, 'to theme:', themeId);

    // Update the user's selected_theme
    const updated = await supabaseRestPatch(
      `/rest/v1/users?id=eq.${encodeURIComponent(userIdToUpdate)}`,
      { selected_theme: themeId }
    );

    const updatedUser = Array.isArray(updated) && updated[0] ? updated[0] : updated;

    console.log('Theme updated successfully:', updatedUser);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        selected_theme: updatedUser.selected_theme || themeId,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user theme:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user theme' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/theme - Get user's selected theme
 * Query params: userId, phone, or email
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    // Validate that at least one identifier is provided
    if (!userId && !phone && !email) {
      return NextResponse.json(
        { error: 'At least one of userId, phone, or email is required' },
        { status: 400 }
      );
    }

    // Build query to find user - try userId first, then phone, then email
    let userQuery = '/rest/v1/users?select=id,selected_theme';
    
    if (userId) {
      userQuery += `&id=eq.${encodeURIComponent(userId)}`;
    } else if (phone) {
      userQuery += `&phone=eq.${encodeURIComponent(phone)}`;
    } else if (email) {
      userQuery += `&email=eq.${encodeURIComponent(email)}`;
    }

    // Find the user
    const users = await supabaseRestGet(userQuery);
    
    if (!users || (Array.isArray(users) && users.length === 0)) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the first matching user
    const user = Array.isArray(users) ? users[0] : users;

    return NextResponse.json({
      success: true,
      theme: user.selected_theme || 'default',
      userId: user.id,
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting user theme:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user theme' },
      { status: 500 }
    );
  }
}
