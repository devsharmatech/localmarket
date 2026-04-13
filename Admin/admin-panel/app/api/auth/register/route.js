import { supabaseRestGet, supabaseRestInsert } from '@/lib/supabaseAdminFetch';

function toStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

// Simple password hashing (in production, use bcrypt or similar)
// For now, we'll store plain text passwords (NOT RECOMMENDED FOR PRODUCTION)
// TODO: Implement proper password hashing with bcrypt

export async function POST(req) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return Response.json({ error: 'Request body is required' }, { status: 400 });
    }

    const { full_name, name, email, phone, password, state, city } = body;

    // Validate required fields
    const userName = toStr(full_name || name);
    const userPhone = toStr(phone);
    
    if (!userName) {
      return Response.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (!userPhone) {
      return Response.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = userPhone.replace(/^\+91/, '').replace(/\D/g, '');
    
    if (normalizedPhone.length < 10) {
      return Response.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    // Check if phone already exists
    try {
      const existingPhoneQuery = new URLSearchParams();
      existingPhoneQuery.set('select', 'id');
      existingPhoneQuery.set('phone', `eq.${normalizedPhone}`);
      existingPhoneQuery.set('limit', '1');
      
      const existingPhone = await supabaseRestGet(`/rest/v1/users?${existingPhoneQuery.toString()}`);
      if (Array.isArray(existingPhone) && existingPhone.length > 0) {
        return Response.json({ error: 'Phone number already registered' }, { status: 409 });
      }
    } catch (e) {
      console.error('Error checking existing phone:', e);
    }

    // If email is provided, check if it already exists
    const userEmail = email ? toStr(email).toLowerCase() : null;
    if (userEmail) {
      try {
        const existingEmailQuery = new URLSearchParams();
        existingEmailQuery.set('select', 'id');
        existingEmailQuery.set('email', `eq.${userEmail}`);
        existingEmailQuery.set('limit', '1');
        
        const existingEmail = await supabaseRestGet(`/rest/v1/users?${existingEmailQuery.toString()}`);
        if (Array.isArray(existingEmail) && existingEmail.length > 0) {
          return Response.json({ error: 'Email already registered' }, { status: 409 });
        }
      } catch (e) {
        console.error('Error checking existing email:', e);
      }
    }

    // Password is always required
    const userPassword = toStr(password);
    if (!userPassword) {
      return Response.json({ error: 'Password is required' }, { status: 400 });
    }
    
    if (userPassword.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Create user object
    const userData = {
      full_name: userName,
      phone: normalizedPhone,
      email: userEmail || null,
      password: userPassword, // Store password (in production, hash it)
      state: state ? toStr(state) : null,
      city: city ? toStr(city) : null,
      status: 'Active',
    };

    // Insert user
    const inserted = await supabaseRestInsert('/rest/v1/users', [userData]);
    
    if (!Array.isArray(inserted) || inserted.length === 0) {
      return Response.json({ error: 'Failed to create user' }, { status: 500 });
    }

    const newUser = inserted[0];

    // Return user data (without password)
    const { password: _, otp: __, otp_expires_at: ___, ...userResponse } = newUser;
    
    return Response.json({
      success: true,
      user: {
        id: userResponse.id,
        name: userResponse.full_name || userResponse.name,
        email: userResponse.email,
        phone: userResponse.phone,
        state: userResponse.state,
        city: userResponse.city,
        status: userResponse.status,
      },
      message: 'Registration successful',
    }, { status: 201 });
  } catch (e) {
    console.error('Registration error:', e);
    
    // Handle unique constraint violation
    if (e?.message?.includes('duplicate') || e?.message?.includes('unique')) {
      return Response.json({ error: 'Phone number or email already registered' }, { status: 409 });
    }
    
    return Response.json({ error: e?.message || 'Registration failed' }, { status: 500 });
  }
}
