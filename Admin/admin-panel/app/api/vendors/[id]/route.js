import { supabaseRestGet, supabaseRestDelete } from '@/lib/supabaseAdminFetch';

// GET /api/vendors/[id]  — full vendor detail + products + enquiries + reviews
export async function GET(req, { params }) {
    const { id } = await params;
    if (!id) return Response.json({ error: 'Vendor ID required' }, { status: 400 });

    try {
        const [vendors, products, enquiries, reviews] = await Promise.all([
            supabaseRestGet(`/rest/v1/vendors?id=eq.${id}&select=*&limit=1`),
            supabaseRestGet(`/rest/v1/vendor_products?vendor_id=eq.${id}&select=*,categories(name)&order=created_at.desc`).catch(() => []),
            supabaseRestGet(`/rest/v1/enquiries?vendor_id=eq.${id}&select=*&order=created_at.desc`).catch(() => []),
            supabaseRestGet(`/rest/v1/reviews?vendor_id=eq.${id}&select=*&order=created_at.desc`).catch(() => []),
        ]);

        if (!Array.isArray(vendors) || vendors.length === 0) {
            return Response.json({ error: 'Vendor not found' }, { status: 404 });
        }

        const v = vendors[0];
        const vendor = {
            id: v.id,
            vendorId: v.id,
            name: v.name || v.shop_name || '',
            ownerName: v.owner_name || v.owner || '',
            email: v.email || '',
            phone: v.contact_number || '',
            contactNumber: v.contact_number || '',
            category: v.category || '',
            address: v.address || '',
            city: v.city || '',
            state: v.state || '',
            pincode: v.pincode || '',
            landmark: v.landmark || '',
            district: v.district || '',
            status: v.status || 'Active',
            kycStatus: v.kyc_status || 'Approved',
            activationStatus: v.status || 'Active',
            rating: v.rating || 0,
            reviewCount: v.review_count || 0,
            profileImageUrl: v.profile_image_url || null,
            imageUrl: v.image_url || v.shop_front_photo_url || null,
            idProofUrl: v.id_proof_url || null,
            shopProofUrl: v.shop_proof_url || null,
            shopFrontPhotoUrl: v.shop_front_photo_url || v.image_url || null,
            about: v.about || '',
            openTime: v.open_time || '09:00 AM',
            closeTime: v.close_time || '09:00 PM',
            openingTime: v.open_time || '09:00',
            closingTime: v.close_time || '21:00',
            createdAt: v.created_at || '',
            profileViews: v.profile_views || 0,
            searchAppearances: v.search_appearances || 0,
            role: 'vendor',
            location: {
                lat: v.latitude || 28.6139,
                lng: v.longitude || 77.2090,
                city: v.city || 'Delhi',
                state: v.state || 'Delhi',
                address: v.address || '',
                pincode: v.pincode || ''
            }
        };

        return Response.json({
            vendor,
            products: Array.isArray(products) ? products.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                mrp: p.original_price || p.mrp || p.price,
                discount: p.discount,
                category: p.categories?.name || p.category_name || '',
                imageUrl: p.image_url,
                description: p.description,
                status: p.is_active !== undefined ? (p.is_active ? 'Active' : 'Inactive') : (p.status || 'Active'),
                inStock: p.is_active !== false // Map is_active to inStock boolean
            })) : [],
            enquiries: Array.isArray(enquiries) ? enquiries.map(e => ({
                id: e.id,
                senderName: e.sender_name || 'Customer',
                senderPhone: e.sender_phone || '',
                date: e.created_at ? new Date(e.created_at).toLocaleDateString() : '',
                message: e.message,
                status: e.status
            })) : [],
            reviews: Array.isArray(reviews) ? reviews.map(r => ({
                id: r.id,
                user_name: r.user_name || r.customer_name || 'Customer',
                rating: r.rating,
                comment: r.comment,
                created_at: r.created_at,
                reply: r.reply
            })) : [],
        }, { status: 200 });
    } catch (e) {
        console.error('Vendor detail error:', e);
        return Response.json({ error: e?.message || 'Failed to load vendor' }, { status: 500 });
    }
}

// DELETE /api/vendors/[id]
export async function DELETE(req, { params }) {
    const { id } = await params;
    if (!id) return Response.json({ error: 'Vendor ID required' }, { status: 400 });

    try {
        console.log(`Deleting vendor ${id}...`);

        // 1. Delete related data (best effort cleanup)
        // Note: If you have ON DELETE CASCADE in Postgres, these are redundant but safe.
        await Promise.allSettled([
            supabaseRestDelete(`/rest/v1/vendor_products?vendor_id=eq.${id}`),
            supabaseRestDelete(`/rest/v1/enquiries?vendor_id=eq.${id}`),
            supabaseRestDelete(`/rest/v1/reviews?vendor_id=eq.${id}`),
        ]);

        // 2. Delete the vendor
        await supabaseRestDelete(`/rest/v1/vendors?id=eq.${id}`);

        return Response.json({ success: true, message: 'Vendor deleted successfully' });
    } catch (e) {
        console.error('Vendor delete error:', e);
        return Response.json({ error: e?.message || 'Failed to delete vendor' }, { status: 500 });
    }
}
