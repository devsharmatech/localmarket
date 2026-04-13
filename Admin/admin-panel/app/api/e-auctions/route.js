import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestInsert, supabaseRestPatch, supabaseRestDelete } from '@/lib/supabaseAdminFetch';

// GET /api/e-auctions - Get all auctions/draws
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = '/rest/v1/e_auctions?select=*&order=created_at.desc';
    if (status) {
      query += `&status=eq.${status}`;
    }

    const auctions = await supabaseRestGet(query);
    return NextResponse.json(auctions);
  } catch (error) {
    console.error('Error fetching e-auctions:', error);
    if (error.message && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND'))) {
      return NextResponse.json({ auctions: [], warning: 'offline_mode' }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/e-auctions - Create a new auction/draw
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      type,
      circle,
      start_date,
      end_date,
      description,
      min_bid,
      max_participants,
    } = body;

    if (!title || !type || !circle || !start_date || !end_date) {
      return NextResponse.json({ error: 'Title, type, circle, start_date, and end_date are required' }, { status: 400 });
    }

    const auction = {
      title,
      type,
      circle,
      start_date,
      end_date,
      description: description || null,
      min_bid: min_bid ? parseFloat(min_bid) : null,
      max_participants: max_participants ? parseInt(max_participants) : null,
      status: 'upcoming',
      participants_count: 0,
      offers_count: 0,
    };

    const result = await supabaseRestInsert('/rest/v1/e_auctions', auction);
    return NextResponse.json(result[0] || result, { status: 201 });
  } catch (error) {
    console.error('Error creating e-auction:', error);
    if (error.message && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND'))) {
      return NextResponse.json({ success: false, warning: 'Sync failed: Database unreachable' });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/e-auctions - Update auction
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Auction ID is required' }, { status: 400 });
    }

    const result = await supabaseRestPatch(`/rest/v1/e_auctions?id=eq.${id}`, updates);
    return NextResponse.json(result[0] || result);
  } catch (error) {
    console.error('Error updating e-auction:', error);
    if (error.message && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND'))) {
      return NextResponse.json({ success: false, warning: 'Sync failed: Database unreachable' });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// DELETE /api/e-auctions - Delete auction
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Auction ID is required' }, { status: 400 });
    }

    // Deleting an auction should ideally cleanup bids
    // We search for bids first to log or verify if we want
    try {
      // In Supabase, if we have foreign key with ON DELETE CASCADE it would be automatic.
      // If not, we manually delete them.
      await supabaseRestDelete(`/rest/v1/e_auction_bids?auction_id=eq.${id}`);
    } catch (e) {
      console.warn('Failed to cleanup bids:', e.message);
    }

    const result = await supabaseRestDelete(`/rest/v1/e_auctions?id=eq.${id}`);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error deleting e-auction:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
