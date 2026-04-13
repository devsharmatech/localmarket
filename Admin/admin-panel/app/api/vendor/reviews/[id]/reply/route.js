import { NextResponse } from 'next/server';
import { supabaseRestPatch } from '@/lib/supabaseAdminFetch';

/**
 * PATCH /api/vendor/reviews/[id]/reply - Submit a vendor reply to a review
 * Body: { reply }
 */
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        console.log('Review Reply API - Raw Params:', params);
        console.log('Review Reply API - Extracted ID:', id);

        const body = await request.json();
        const { reply } = body;

        if (!id) {
            console.error('Review Reply API - Error: ID is missing');
            return NextResponse.json(
                { error: 'Review ID is required' },
                { status: 400 }
            );
        }

        if (!reply || !reply.trim()) {
            return NextResponse.json(
                { error: 'Reply text is required' },
                { status: 400 }
            );
        }

        // Update the review with the reply
        const result = await supabaseRestPatch(
            `/rest/v1/reviews?id=eq.${id}`,
            { reply: reply.trim() }
        );

        return NextResponse.json({
            success: true,
            message: 'Reply submitted successfully',
            review: Array.isArray(result) ? result[0] : result,
        }, { status: 200 });
    } catch (error) {
        console.error('Error submitting review reply:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to submit reply' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
