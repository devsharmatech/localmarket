import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestInsert, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

// POST /api/e-auctions/[id]/send-offer - Send offer notification to circle users
export async function POST(request, { params }) {
    try {
        const { id } = await params;
        if (!id || id === 'undefined') {
            return NextResponse.json({ error: 'Auction ID is required' }, { status: 400 });
        }

        // Get auction details
        const auctions = await supabaseRestGet(`/rest/v1/e_auctions?id=eq.${id}&select=*`);
        if (!auctions || !auctions[0]) {
            return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
        }

        const auction = auctions[0];

        // Get users in the circle from search logs
        // Wrapped in try/catch in case search_logs table doesn't exist
        let uniqueUserIds = [];
        try {
            const searchLogs = await supabaseRestGet(
                `/rest/v1/search_logs?location_circle=eq.${encodeURIComponent(auction.circle)}&select=user_id&user_id=not.is.null`
            );
            // Validate each user_id is a proper UUID before using
            const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            uniqueUserIds = [...new Set(
                searchLogs
                    .map(log => log.user_id)
                    .filter(uid => uid && UUID_RE.test(String(uid)))
            )];
        } catch (e) {
            console.warn('search_logs query failed (table may not exist):', e.message);
        }

        if (uniqueUserIds.length === 0) {
            return NextResponse.json({ error: 'No eligible users found in this circle' }, { status: 404 });
        }

        const users = uniqueUserIds.map(id => ({ id }));

        // Create notifications for all users
        const notifications = users.map(user => ({
            user_id: user.id,
            type: 'e_auction',
            title: `New ${auction.type === 'e-auction' ? 'E-Auction' : 'Online Draw'}: ${auction.title}`,
            message: `A new ${auction.type === 'e-auction' ? 'e-auction' : 'online draw'} has started in your circle. Check it out!`,
            metadata: { auction_id: id },
            status: 'pending',
        }));

        // Insert notifications in batches (Supabase has limits)
        const batchSize = 100;
        for (let i = 0; i < notifications.length; i += batchSize) {
            const batch = notifications.slice(i, i + batchSize);
            await supabaseRestInsert('/rest/v1/notifications', batch);
        }

        // Update auction offers count
        await supabaseRestPatch(`/rest/v1/e_auctions?id=eq.${id}`, {
            offers_count: users.length,
        });

        return NextResponse.json({
            success: true,
            notifications_sent: users.length,
            message: `Offers sent to ${users.length} users in ${auction.circle}`,
        });
    } catch (error) {
        console.error('Error sending offers:', error);
        if (error.message && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND'))) {
            return NextResponse.json({ success: false, warning: 'Sync failed: Database unreachable' });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
