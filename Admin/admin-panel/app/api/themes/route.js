import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestInsert, supabaseRestPatch, supabaseRestUpsert } from '@/lib/supabaseAdminFetch';

// GET /api/themes - Get all themes
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === 'true';

        let query = '/rest/v1/festival_themes?select=*&order=is_default.desc,created_at.desc';
        if (activeOnly) {
            query += '&is_active=eq.true';
        }

        const themes = await supabaseRestGet(query);

        // Ensure we return an array
        if (!Array.isArray(themes)) {
            console.error('Themes API returned non-array:', themes);
            // If table doesn't exist or is empty, return empty array
            return NextResponse.json([]);
        }

        return NextResponse.json(themes);
    } catch (error) {
        console.error('Error fetching themes:', error);
        // If table doesn't exist, return empty array instead of error
        // This allows the UI to still work and show default themes
        if (error.message && (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('42703'))) {
            console.warn('Festival themes table may not exist. Returning empty array.');
            return NextResponse.json([]);
        }
        if (error.message && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND'))) {
            console.warn('Supabase unreachable. Returning empty array.');
            return NextResponse.json([]);
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/themes - Create a new theme
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, description, icon, colors, is_default = false } = body;

        // Validate required fields
        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'Theme name is required' }, { status: 400 });
        }

        if (!colors) {
            return NextResponse.json({ error: 'Colors are required' }, { status: 400 });
        }

        // Parse colors if it's a string
        let colorsObj = colors;
        if (typeof colors === 'string') {
            try {
                colorsObj = JSON.parse(colors);
            } catch (e) {
                return NextResponse.json({ error: 'Invalid colors format. Must be a valid JSON object.' }, { status: 400 });
            }
        }

        // Validate colors object has required fields
        if (!colorsObj.primary || !colorsObj.secondary || !colorsObj.accent) {
            return NextResponse.json({ error: 'Colors must include primary, secondary, and accent colors' }, { status: 400 });
        }

        // Generate ID if not provided
        const id = body.id || `custom_${Date.now()}_${name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;

        const theme = {
            id,
            name: name.trim(),
            description: description?.trim() || null,
            icon: icon || '🎨',
            colors: {
                primary: colorsObj.primary,
                secondary: colorsObj.secondary,
                accent: colorsObj.accent,
                background: colorsObj.background || '#FFFFFF',
                text: colorsObj.text || '#1A1A1A'
            },
            is_default: is_default || false,
            is_active: false,
        };

        const result = await supabaseRestInsert('/rest/v1/festival_themes', [theme]);

        if (!result || (Array.isArray(result) && result.length === 0)) {
            return NextResponse.json({ error: 'Failed to create theme - no data returned' }, { status: 500 });
        }

        // Ensure we return the created theme with all fields
        const createdTheme = Array.isArray(result) ? result[0] : result;
        return NextResponse.json(createdTheme || theme, { status: 201 });
    } catch (error) {
        console.error('Error creating theme:', error);

        // Check if table doesn't exist
        if (error.message && (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('42703'))) {
            return NextResponse.json({
                error: 'Festival themes table does not exist. Please run the SQL schema file (supabase_schema_additional.sql) in your Supabase SQL Editor to create the table.'
            }, { status: 500 });
        }

        return NextResponse.json({ error: error.message || 'Failed to create theme' }, { status: 500 });
    }
}

// PATCH /api/themes - Update theme (including setting active)
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 });
        }

        // Check if theme exists first
        try {
            const existingTheme = await supabaseRestGet(`/rest/v1/festival_themes?id=eq.${id}&select=id`);
            if (!existingTheme || (Array.isArray(existingTheme) && existingTheme.length === 0)) {
                // Theme doesn't exist, create it (for custom themes that might not be in DB yet)
                if (updates.name && updates.colors) {
                    const newTheme = {
                        id,
                        name: updates.name,
                        description: updates.description || null,
                        icon: updates.icon || '🎨',
                        colors: updates.colors,
                        is_default: false,
                        is_active: updates.is_active || false,
                    };
                    const result = await supabaseRestInsert('/rest/v1/festival_themes', [newTheme]);
                    const createdTheme = Array.isArray(result) ? result[0] : result;

                    // If setting as active, update all users
                    if (updates.is_active === true) {
                        await supabaseRestPatch('/rest/v1/festival_themes?is_active=eq.true', { is_active: false });
                        try {
                            await supabaseRestPatch('/rest/v1/users', { selected_theme: id });
                            console.log(`Updated all users' theme to: ${id}`);
                        } catch (userUpdateError) {
                            console.error('Error updating users theme:', userUpdateError);
                        }
                    }

                    return NextResponse.json(createdTheme || newTheme);
                } else {
                    return NextResponse.json({ error: 'Theme not found and insufficient data to create' }, { status: 404 });
                }
            }
        } catch (checkError) {
            console.error('Error checking theme existence:', checkError);
            // Continue with update attempt
        }

        // If setting a theme as active, deactivate all others first and update all users
        if (updates.is_active === true) {
            // Deactivate all other themes
            await supabaseRestPatch('/rest/v1/festival_themes?is_active=eq.true', { is_active: false });

            // Update ALL users' selected_theme to this theme
            try {
                await supabaseRestPatch('/rest/v1/users', { selected_theme: id });
                console.log(`Updated all users' theme to: ${id}`);
            } catch (userUpdateError) {
                console.error('Error updating users theme:', userUpdateError);
                // Continue even if user update fails - theme is still set as active
            }
        }

        const result = await supabaseRestPatch(`/rest/v1/festival_themes?id=eq.${id}`, updates);
        return NextResponse.json(Array.isArray(result) ? result[0] : result);
    } catch (error) {
        console.error('Error updating theme:', error);
        if (error.message && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND'))) {
            return NextResponse.json({ success: true, warning: 'Sync failed: Database unreachable' });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
