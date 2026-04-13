import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

// GET /api/featured - Fetch vendors and products for management
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'vendors'; // 'vendors' or 'products'
        const city = searchParams.get('city');

        let url = '';
        if (type === 'vendors') {
            url = '/rest/v1/vendors?select=id,name,city,circle,is_verified,is_featured,image_url,status';
            url += '&or=(is_verified.eq.true,is_featured.eq.true)';
            if (city) url += `&city=eq.${encodeURIComponent(city)}`;
            url += '&order=name.asc';
        } else {
            url = '/rest/v1/vendor_products?select=id,name,price,mrp,vendor_id,is_featured,is_price_drop,is_mega_saving,image_url,vendors(name,city,circle)';
            url += '&or=(is_featured.eq.true,is_price_drop.eq.true,is_mega_saving.eq.true)';
            if (city) url += `&vendors.city=eq.${encodeURIComponent(city)}`;
            url += '&order=name.asc';
        }

        const data = await supabaseRestGet(url);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching featured management data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/featured - Toggle flags
export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, type, field, value } = body;
        
        if (!id || !type || !field) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const table = type === 'vendors' ? 'vendors' : 'vendor_products';
        const path = `/rest/v1/${table}?id=eq.${id}`;
        
        // Use the secure supabaseRestPatch helper which uses Service Role Key
        const data = await supabaseRestPatch(path, { [field]: value });
        
        if (!data) {
            throw new Error('No data returned from update');
        }

        return NextResponse.json(Array.isArray(data) ? data[0] : data);
    } catch (error) {
        console.error('Error updating featured flag:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

