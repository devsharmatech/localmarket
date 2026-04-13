import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

export async function POST(req) {
    try {
        const body = await req.json().catch(() => null);
        if (!body) {
            return Response.json({ error: 'Request body is required' }, { status: 400 });
        }

        const { phone, email } = body;

        if (!phone && !email) {
            return Response.json({ error: 'Phone or email is required' }, { status: 400 });
        }

        let query = '/rest/v1/vendors?select=*&limit=1';
        if (phone) {
            let cleaned = phone.replace(/\D/g, '');
            // Handle +91 prefix added by mobile app
            if (cleaned.length === 12 && cleaned.startsWith('91')) {
                cleaned = cleaned.substring(2);
            }
            query += `&contact_number=eq.${encodeURIComponent(cleaned)}`;
        } else {
            query += `&email=eq.${encodeURIComponent(email.toLowerCase().trim())}`;
        }

        const results = await supabaseRestGet(query);
        if (!Array.isArray(results) || results.length === 0) {
            return Response.json({ error: 'No vendor account found with that phone/email. Please register first.' }, { status: 404 });
        }

        const v = results[0];
        const status = (v.status || '').trim();
        if (status !== 'Active') {
            if (status === 'Blocked') {
                return Response.json({
                    error: 'Your account has been blocked. Please contact support.'
                }, { status: 403 });
            }
            return Response.json({
                error: 'Your account is pending admin approval. You will be notified once activated.',
                status,
            }, { status: 403 });
        }

        const vendor = {
            id: v.id,
            vendorId: v.id,
            name: v.name || v.shop_name || '',
            ownerName: v.owner || v.owner_name || '',
            email: v.email || '',
            phone: v.contact_number || '',
            contactNumber: v.contact_number || '',
            category: v.category || '',
            address: v.address || '',
            city: v.city || '',
            state: v.state || '',
            pincode: v.pincode || '',
            status: v.status || 'Active',
            kycStatus: v.kyc_status || v.kycStatus || 'Pending',
            activationStatus: v.status || 'Active',
            rating: v.rating || 0,
            reviewCount: v.review_count || v.reviewCount || 0,
            imageUrl: v.image_url || v.imageUrl || v.shop_front_photo_url || null,
            openTime: v.open_time || '09:00 AM',
            closeTime: v.close_time || '09:00 PM',
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

        return Response.json({ success: true, vendor, user: vendor }, { status: 200 });
    } catch (error) {
        console.error('Vendor login error:', error);
        return Response.json({ error: error.message || 'Login failed' }, { status: 500 });
    }
}
