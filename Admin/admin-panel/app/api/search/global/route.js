import { NextResponse } from 'next/server';
import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'vendors'; // 'vendors' or 'products'

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    if (type === 'vendors') {
      const data = await supabaseRestGet(
        `/rest/v1/vendors?select=id,name,city,circle,imageUrl:image_url,shop_front_photo_url&name=ilike.*${encodeURIComponent(query)}*&limit=15`
      );
      
      // Map for consistent UI consumption
      const mapped = (data || []).map(v => ({
        id: v.id,
        name: v.name,
        city: v.city || 'Unknown',
        circle: v.circle || 'Local Market',
        imageUrl: v.imageUrl || v.shop_front_photo_url
      }));
      
      return NextResponse.json(mapped);
    } else {
      // Search products
      const data = await supabaseRestGet(
        `/rest/v1/vendor_products?select=id,name,price,imageUrl:image_url,vendors(name,city,circle)&name=ilike.*${encodeURIComponent(query)}*&limit=15`
      );
      
      const mapped = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        imageUrl: p.imageUrl,
        city: p.vendors?.city || 'Unknown',
        circle: p.vendors?.circle || 'Local Market'
      }));
      
      return NextResponse.json(mapped);
    }
  } catch (error) {
    console.error('Global search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
