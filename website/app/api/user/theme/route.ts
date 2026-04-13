import { NextRequest, NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestPatch, supabaseRestUpsert } from '@/lib/supabaseAdminFetch';

// GET /api/user/theme - Get user's theme preference
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    // First, get the global default theme (set by admin)
    let globalDefaultTheme = 'default';
    try {
      const globalThemeRes = await supabaseRestGet('/rest/v1/festival_themes?select=id&is_active=eq.true');
      if (Array.isArray(globalThemeRes) && globalThemeRes.length > 0) {
        globalDefaultTheme = globalThemeRes[0].id || 'default';
      }
    } catch (error) {
      console.error('Error fetching global default theme:', error);
    }

    // If no user identifier provided, return global default
    if (!userId && !phone && !email) {
      return NextResponse.json({
        theme: globalDefaultTheme,
        isGlobalDefault: true,
      });
    }

    // Attempt to find in users table first
    let userQuery = '/rest/v1/users?select=id,selected_theme';
    if (userId) userQuery += `&id=eq.${encodeURIComponent(userId)}`;
    else if (phone) userQuery += `&phone=eq.${encodeURIComponent(phone)}`;
    else if (email) userQuery += `&email=eq.${encodeURIComponent(email)}`;

    let users = await supabaseRestGet(userQuery);
    
    if (Array.isArray(users) && users.length > 0) {
      const user = users[0];
      return NextResponse.json({
        userId: user.id,
        theme: user.selected_theme || globalDefaultTheme,
        isGlobalDefault: !user.selected_theme,
      });
    }

    // Not in users, try vendors table
    let vendorQuery = '/rest/v1/vendors?select=id,selected_theme';
    if (userId) vendorQuery += `&id=eq.${encodeURIComponent(userId)}`;
    else if (phone) vendorQuery += `&contact_number=eq.${encodeURIComponent(phone)}`;
    else if (email) vendorQuery += `&email=eq.${encodeURIComponent(email)}`;

    let vendors = await supabaseRestGet(vendorQuery).catch(() => []);
    
    if (Array.isArray(vendors) && vendors.length > 0) {
      const vendor = vendors[0];
      return NextResponse.json({
        userId: vendor.id,
        theme: vendor.selected_theme || globalDefaultTheme,
        isGlobalDefault: !vendor.selected_theme,
      });
    }

    // User not found in either table, return global default
    return NextResponse.json({
      theme: globalDefaultTheme,
      isGlobalDefault: true,
    });
  } catch (error: any) {
    console.error('Error fetching user theme:', error);
    return NextResponse.json({ theme: 'default', isGlobalDefault: true });
  }
}

// PATCH /api/user/theme - Update user's theme preference
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, phone, email, theme } = body;

    if (!theme) {
      return NextResponse.json({ error: 'Theme is required' }, { status: 400 });
    }

    // Standardize phone for search
    let standardizedPhone = phone;
    if (phone) {
        standardizedPhone = phone.replace(/\D/g, '');
        if (standardizedPhone.length === 12 && standardizedPhone.startsWith('91')) {
            standardizedPhone = standardizedPhone.substring(2);
        }
    }

    // 1. Try updating in users table
    let userQuery = '/rest/v1/users?select=id';
    if (userId) userQuery += `&id=eq.${encodeURIComponent(userId)}`;
    else if (phone) userQuery += `&phone=in.(${encodeURIComponent(standardizedPhone)},91${encodeURIComponent(standardizedPhone)})`;
    else if (email) userQuery += `&email=eq.${encodeURIComponent(email)}`;

    const users = await supabaseRestGet(userQuery).catch(() => []);
    
    if (Array.isArray(users) && users.length > 0) {
      const user = users[0];
      await supabaseRestPatch(`/rest/v1/users?id=eq.${user.id}`, { selected_theme: theme });
      return NextResponse.json({ success: true, userId: user.id, theme });
    }

    // 2. Try updating in vendors table
    let vendorQuery = '/rest/v1/vendors?select=id';
    if (userId) vendorQuery += `&id=eq.${encodeURIComponent(userId)}`;
    else if (phone) vendorQuery += `&contact_number=in.(${encodeURIComponent(standardizedPhone)},91${encodeURIComponent(standardizedPhone)})`;
    else if (email) vendorQuery += `&email=eq.${encodeURIComponent(email)}`;

    const vendors = await supabaseRestGet(vendorQuery).catch(() => []);
    
    if (Array.isArray(vendors) && vendors.length > 0) {
      const vendor = vendors[0];
      // Try to update vendors table. Note: If selected_theme column doesn't exist, this might fail or do nothing
      try {
        await supabaseRestPatch(`/rest/v1/vendors?id=eq.${vendor.id}`, { selected_theme: theme });
        return NextResponse.json({ success: true, userId: vendor.id, theme });
      } catch (err) {
        // If column missing, just return success as it's saved locally on mobile anyway
        console.warn('Could not save theme to vendors table (possibly missing column):', err);
        return NextResponse.json({ success: true, userId: vendor.id, theme, warning: 'Saved locally but not synced to profile' });
      }
    }

    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error updating user theme:', error);
    return NextResponse.json({ error: error.message || 'Failed to update theme' }, { status: 500 });
  }
}

