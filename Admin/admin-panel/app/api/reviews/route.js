import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestInsert } from '@/lib/supabaseAdminFetch';

/**
 * GET /api/reviews - Get reviews for a vendor
 * Query params: vendorId
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required' },
        { status: 400 }
      );
    }

    const reviews = await supabaseRestGet(
      `/rest/v1/reviews?vendor_id=eq.${encodeURIComponent(vendorId)}&select=*&order=created_at.desc`
    );

    return NextResponse.json({
      reviews: Array.isArray(reviews) ? reviews : [],
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews - Create a new review
 * Body: { vendorId, userId, userName, rating, comment }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { vendorId, userId, userName, rating, comment } = body;

    // Validate required fields
    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }

    if (!userName || !userName.trim()) {
      return NextResponse.json(
        { error: 'User name is required' },
        { status: 400 }
      );
    }

    const review = {
      vendor_id: vendorId,
      user_id: userId || null,
      user_name: userName.trim(),
      rating: parseInt(rating),
      comment: comment.trim(),
      created_at: new Date().toISOString(),
    };

    const result = await supabaseRestInsert('/rest/v1/reviews', [review]);
    const createdReview = Array.isArray(result) ? result[0] : result;

    return NextResponse.json({
      review: createdReview,
      success: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 500 }
    );
  }
}
