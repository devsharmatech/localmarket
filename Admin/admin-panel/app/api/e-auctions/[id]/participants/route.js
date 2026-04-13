import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

// GET /api/e-auctions/[id]/participants - Fetch all bidders for an auction
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'Auction ID is required' }, { status: 400 });
        }

        const participants = await supabaseRestGet(`/rest/v1/e_auction_bids?auction_id=eq.${id}&select=*&order=bid_amount.desc,created_at.asc`);
        return NextResponse.json(participants);
    } catch (error) {
        console.error('Error fetching participants:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/e-auctions/[id]/participants - Update participant status (e.g., mark as winner)
export async function PATCH(request, { params }) {
    try {
        const { id } = await params; // auction_id
        const body = await request.json();
        const { bid_id, status } = body;

        if (!bid_id || !status) {
            return NextResponse.json({ error: 'bid_id and status are required' }, { status: 400 });
        }

        // 1. Update the bid status
        const updatedBid = await supabaseRestPatch(`/rest/v1/e_auction_bids?id=eq.${bid_id}`, { status });

        // 2. If status is 'winner', mark the auction as completed/closed and store winner info if needed
        if (status === 'winner') {
            try {
                await supabaseRestPatch(`/rest/v1/e_auctions?id=eq.${id}`, {
                    status: 'completed'
                });
            } catch (auctionError) {
                console.warn('Failed to update auction status to completed:', auctionError.message);
            }
        }

        return NextResponse.json(updatedBid[0] || updatedBid);
    } catch (error) {
        console.error('Error updating participant:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
