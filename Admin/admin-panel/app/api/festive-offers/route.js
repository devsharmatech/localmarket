import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestInsert, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

// GET /api/festive-offers - Get all offers
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = '/rest/v1/festive_offers?select=*&order=created_at.desc';
        if (status) {
            query += `&status=eq.${status}`;
        }

        const offers = await supabaseRestGet(query);
        return NextResponse.json(offers);
    } catch (error) {
        console.error('Error fetching festive offers:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/festive-offers - Create a new offer
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            title,
            type,
            target,
            circle,
            vendor_ids,
            start_date,
            end_date,
            discount_percent,
            description,
            image_url,
        } = body;

        // Validate required fields
        if (!title || !title.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }
        if (!type) {
            return NextResponse.json({ error: 'Type is required' }, { status: 400 });
        }
        if (!target) {
            return NextResponse.json({ error: 'Target is required' }, { status: 400 });
        }
        if (!start_date) {
            return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
        }
        if (!end_date) {
            return NextResponse.json({ error: 'End date is required' }, { status: 400 });
        }

        // Validate date format (should be YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(start_date)) {
            return NextResponse.json({ error: 'Start date must be in YYYY-MM-DD format' }, { status: 400 });
        }
        if (!dateRegex.test(end_date)) {
            return NextResponse.json({ error: 'End date must be in YYYY-MM-DD format' }, { status: 400 });
        }

        // Validate date logic
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (isNaN(startDate.getTime())) {
            return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
        }
        if (isNaN(endDate.getTime())) {
            return NextResponse.json({ error: 'Invalid end date' }, { status: 400 });
        }
        if (endDate < startDate) {
            return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
        }

        // Validate discount if provided
        if (discount_percent !== null && discount_percent !== undefined) {
            const discount = parseFloat(discount_percent);
            if (isNaN(discount) || discount < 0 || discount > 100) {
                return NextResponse.json({ error: 'Discount must be a number between 0 and 100' }, { status: 400 });
            }
        }

        const offer = {
            title: title.trim(),
            type,
            target,
            circle: circle?.trim() || null,
            vendor_ids: vendor_ids && Array.isArray(vendor_ids) && vendor_ids.length > 0 ? vendor_ids : null,
            start_date,
            end_date,
            discount_percent: discount_percent !== null && discount_percent !== undefined ? parseFloat(discount_percent) : null,
            description: description?.trim() || null,
            image_url: image_url || null,
            status: 'active',
        };

        // supabaseRestInsert expects an array
        const result = await supabaseRestInsert('/rest/v1/festive_offers', [offer]);

        if (!result || (Array.isArray(result) && result.length === 0)) {
            return NextResponse.json({ error: 'Failed to create offer - no data returned' }, { status: 500 });
        }

        return NextResponse.json(Array.isArray(result) ? result[0] : result, { status: 201 });
    } catch (error) {
        console.error('Error creating festive offer:', error);
        let errorMessage = error.message || 'Failed to create offer';

        // Provide helpful error message if table doesn't exist
        if (errorMessage.includes('Could not find the table') || errorMessage.includes('PGRST205')) {
            errorMessage = 'The festive_offers table does not exist in Supabase. Please run the SQL script: sql/create_festive_offers_table.sql';
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// PATCH /api/festive-offers - Update offer
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
        }

        const result = await supabaseRestPatch(`/rest/v1/festive_offers?id=eq.${id}`, updates);
        return NextResponse.json(result[0] || result);
    } catch (error) {
        console.error('Error updating festive offer:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
