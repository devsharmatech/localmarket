const fs = require('fs');
const path = require('path');

// Load env from .env.local
const envPath = path.join('Admin', 'admin-panel', '.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match) {
            process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
    });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
}

async function verifyUser() {
    try {
        console.log(`Checking user: admin@localmarket.com at ${SUPABASE_URL}`);
        const url = `${SUPABASE_URL}/rest/v1/users?email=eq.admin@localmarket.com&select=*`;
        const res = await fetch(url, {
            headers: {
                apikey: key,
                Authorization: `Bearer ${key}`
            }
        });
        
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
            console.log('User found:');
            // Remove sensitive fields
            const { id, full_name, email, phone, is_admin, status, password } = data[0];
            console.log({ id, full_name, email, phone, is_admin, status, hasPassword: !!password });
            if (password === 'admin') {
                console.log('Password matches "admin"');
            } else {
                console.log('Password does NOT match "admin" or is hashed.');
            }
        } else {
            console.log('User NOT found.');
        }
    } catch (e) {
        console.error('Error during verification:', e);
    }
}

verifyUser();
