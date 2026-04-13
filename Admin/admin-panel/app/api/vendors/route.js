import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

function toStr(v) {
    return typeof v === 'string' ? v : '';
}

function normalizeVendor(v) {
    // Accept either camelCase or snake_case columns (common when coming from Postgres).
    return {
        id: v.id ?? v.vendor_id ?? v.vendorId,
        name: v.name ?? v.shop_name ?? v.shopName ?? '',
        owner: v.owner ?? v.owner_name ?? v.ownerName ?? '',
        ownerName: v.ownerName ?? v.owner_name ?? v.owner ?? '',
        status: v.status ?? 'Active',
        kycStatus: v.kycStatus ?? v.kyc_status ?? 'Pending',
        productCount: v.productCount ?? v.product_count ?? 0,
        state: v.state ?? '',
        city: v.city ?? '',
        town: v.town ?? '',
        tehsil: v.tehsil ?? '',
        subTehsil: v.subTehsil ?? v.sub_tehsil ?? '',
        circle: v.circle ?? '',
        joinedDate: v.joinedDate ?? v.joined_date ?? v.created_at ?? '',
        lastActive: v.last_active_at ?? v.last_active ?? '',
        category: v.category ?? '',
        rating: v.rating ?? 0,
        reviewCount: v.reviewCount ?? v.review_count ?? 0,
        contactNumber: v.contactNumber ?? v.contact_number ?? '',
        email: v.email ?? '',
        address: v.address ?? '',
        landmark: v.landmark ?? '',
        pincode: v.pincode ?? '',
        imageUrl: v.imageUrl ?? v.image_url ?? v.shopFrontPhotoUrl ?? v.shop_front_photo_url ?? null,
        shopFrontPhotoUrl: v.shopFrontPhotoUrl ?? v.shop_front_photo_url ?? v.imageUrl ?? v.image_url ?? null,
    };
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        const status = toStr(searchParams.get('status')); // Active | Pending | Blocked
        const q = toStr(searchParams.get('q'));
        const state = toStr(searchParams.get('state'));
        const city = toStr(searchParams.get('city'));
        const town = toStr(searchParams.get('town'));
        const tehsil = toStr(searchParams.get('tehsil'));
        const subTehsil = toStr(searchParams.get('subTehsil'));
        const page = Math.max(1, Number(searchParams.get('page') || 1));
        const limit = Math.min(Math.max(10, Number(searchParams.get('limit') || 20)), 100);
        const offset = (page - 1) * limit;

        // Build base query for filtering
        const baseQuery = new URLSearchParams();
        baseQuery.set('select', '*');
        baseQuery.set('order', 'city.asc,name.asc');

        // Filters
        if (status && status !== 'all') baseQuery.set('status', `eq.${status}`);
        if (state && state !== 'All') baseQuery.set('state', `eq.${state}`);
        if (city && city !== 'All') baseQuery.set('city', `eq.${city}`);
        if (town && town !== 'All') baseQuery.set('town', `eq.${town}`);
        if (tehsil && tehsil !== 'All') baseQuery.set('tehsil', `eq.${tehsil}`);
        if (subTehsil && subTehsil !== 'All') baseQuery.set('subTehsil', `eq.${subTehsil}`);

        // Search (name OR owner OR category)
        if (q) {
            // PostgREST OR syntax: or=(col.op.value,col.op.value,col.op.value)
            baseQuery.set('or', `(name.ilike.*${q}*,owner.ilike.*${q}*,category.ilike.*${q}*)`);
        }

        // Also support direct category filter
        const category = toStr(searchParams.get('category'));
        if (category && category !== 'All') {
            baseQuery.set('category', `ilike.*${category}*`);
        }

        // Get total count for pagination
        const countQuery = new URLSearchParams(baseQuery);
        countQuery.set('select', 'id');
        let totalCount = 0;
        try {
            const countRows = await supabaseRestGet(`/rest/v1/vendors?${countQuery.toString()}`);
            totalCount = Array.isArray(countRows) ? countRows.length : 0;
        } catch (e) {
            console.error('Error getting vendor count:', e);
        }

        // Get paginated results
        const dataQuery = new URLSearchParams(baseQuery);
        dataQuery.set('limit', String(limit));
        dataQuery.set('offset', String(offset));

        const rows = await supabaseRestGet(`/rest/v1/vendors?${dataQuery.toString()}`);
        const vendors = Array.isArray(rows) ? rows.map(normalizeVendor) : [];

        return Response.json({
            vendors,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
            }
        }, { status: 200 });
    } catch (e) {
        console.error('Vendors Error:', e);
        if (e.message && (e.message.includes('fetch failed') || e.message.includes('ENOTFOUND'))) {
            return Response.json({
                vendors: [],
                pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
                warning: 'offline_mode'
            }, { status: 200 });
        }
        return Response.json(
            { error: e?.message || 'Failed to load vendors' },
            { status: 500 }
        );
    }
}

