import { supabaseRestGet, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

// GET /api/vendor/profile?id=xxx  — fetch full vendor data + products + enquiries + reviews
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return Response.json({ error: 'Vendor ID required' }, { status: 400 });

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

        // Robust normalization to match mobile app expectations (INITIAL_VENDOR_DATA model)
        const vendor = {
            id: v.id,
            vendorId: v.id, // Mobile sometimes uses vendorId
            name: v.name || v.shop_name || '',
            ownerName: v.owner_name || v.owner || '',
            email: v.email || '',
            phone: v.contact_number || '',
            contactNumber: v.contact_number || '', // Mobile expects contactNumber
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
            about: v.about || '',
            openTime: v.open_time || '09:00 AM',
            closeTime: v.close_time || '09:00 PM', // Mobile expects closeTime
            openingTime: v.open_time || '09:00',
            closingTime: v.close_time || '21:00',
            createdAt: v.created_at || '',
            profileViews: v.profile_views || 0,
            searchAppearances: v.search_appearances || 0,
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
                mrp: p.original_price || p.mrp || p.price, // Mobile expects mrp
                discount: p.discount,
                category: p.categories?.name || p.category_name || '',
                imageUrl: p.image_url,
                description: p.description,
                status: p.status,
                inStock: p.status === 'Active' // Mobile expects inStock boolean
            })) : [],
            enquiries: Array.isArray(enquiries) ? enquiries.map(e => ({
                id: e.id,
                senderName: e.sender_name || 'Customer',
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
        });
    } catch (error) {
        console.error('Vendor profile error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/vendor/profile  — update vendor details
export async function PATCH(req) {
    try {
        const body = await req.json();
        const { id, ...updates } = body;
        if (!id) return Response.json({ error: 'Vendor ID required' }, { status: 400 });

        const allowed = [
            'name', 'owner_name', 'email', 'address', 'city', 'state', 'pincode',
            'about', 'open_time', 'close_time', 'category', 'contact_number',
            'image_url', 'profile_image_url'
        ];

        // Map mobile camelCase to database snake_case
        const mapping = {
            ownerName: 'owner_name',
            contactNumber: 'contact_number',
            openTime: 'open_time',
            closeTime: 'close_time'
        };

        const filtered = {};

        // Process mapped fields
        for (const [mobileKey, dbKey] of Object.entries(mapping)) {
            if (updates[mobileKey] !== undefined) {
                filtered[dbKey] = updates[mobileKey];
            }
        }

        // Process standard allowed fields
        for (const key of allowed) {
            if (updates[key] !== undefined) {
                filtered[key] = updates[key];
            }
        }

        const result = await supabaseRestPatch(`/rest/v1/vendors?id=eq.${id}`, filtered);
        return Response.json({ success: true, vendor: Array.isArray(result) ? result[0] : result });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
