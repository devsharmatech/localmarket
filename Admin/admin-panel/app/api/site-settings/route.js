import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestPatch } from '../../../lib/supabaseAdminFetch';

export async function GET() {
    try {
        const settings = await supabaseRestGet('/rest/v1/site_settings?id=eq.default&select=*');
        return NextResponse.json({ success: true, settings: settings[0] || {} });
    } catch (error) {
        console.error('Site Settings GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        
        // Update the default row
        const res = await supabaseRestPatch('/rest/v1/site_settings?id=eq.default', {
            ...body,
            updated_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Site Settings POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
