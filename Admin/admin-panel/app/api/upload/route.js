import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const bucket = formData.get('bucket') || 'vendor-documents';
        const folder = formData.get('folder') || 'general';

        console.log(`Upload Request - File: ${file?.name}, Type: ${file?.type}, Size: ${file?.size} bytes`);

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400, headers: corsHeaders });
        }

        if (file.size > 4.5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size exceeds 4.5MB limit' }, { status: 413, headers: corsHeaders });
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500, headers: corsHeaders });
        }

        const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const filePath = `${folder}/${filename}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Content-Type': file.type,
                'x-upsert': 'true',
            },
            body: buffer,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supabase Storage Error:', errorText);
            return NextResponse.json({ error: `Upload failed: ${errorText}` }, { status: response.status, headers: corsHeaders });
        }

        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: filePath,
        }, { status: 200, headers: corsHeaders });
    } catch (error) {
        console.error('Upload API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
