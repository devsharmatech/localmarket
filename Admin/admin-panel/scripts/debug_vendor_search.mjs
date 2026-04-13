
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const [key, ...val] = line.split('=');
            return [key.trim(), val.join('=').trim().replace(/^"(.*)"$/, '$1')];
        })
);

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function debugSearch(searchKeyword) {
    const query = new URLSearchParams();
    query.set('select', '*');
    query.set('limit', '10');
    // query.set('status', 'ilike.*Active*'); // Omitting status to see everything first

    if (searchKeyword !== 'general') {
        if (searchKeyword.includes('plumb')) {
            query.set('category', 'ilike.*Plumbing*');
        } else if (searchKeyword.includes('electric')) {
            query.set('category', 'ilike.*Electrical*');
        } else if (searchKeyword.includes('repair') || searchKeyword.includes('electronic')) {
            query.set('category', 'ilike.*Electronics Repair*');
        } else if (searchKeyword.includes('food') || searchKeyword.includes('restaurant') || searchKeyword.includes('snack') || searchKeyword.includes('hungry') || searchKeyword.includes('craving')) {
            query.set('or', '(category.ilike.*Food*,category.ilike.*Restaurant*,category.ilike.*Snacks*,category.ilike.*Bakery*,category.ilike.*Beverages*)');
        } else if (searchKeyword.includes('clean')) {
            query.set('category', 'ilike.*Cleaning*');
        } else if (searchKeyword.includes('grocery') || searchKeyword.includes('shop') || searchKeyword.includes('groceries') || searchKeyword.includes('buy') || searchKeyword.includes('milk') || searchKeyword.includes('fruit')) {
            query.set('or', '(category.ilike.*Grocery*,category.ilike.*General Store*,category.ilike.*Dairy*,category.ilike.*Fruits*,category.ilike.*Vegetables*,category.ilike.*Spices*)');
        } else if (searchKeyword.includes('medical') || searchKeyword.includes('medicine') || searchKeyword.includes('health') || searchKeyword.includes('pharmacy') || searchKeyword.includes('mediacl')) {
            query.set('category', 'ilike.*Health*');
        } else if (searchKeyword.includes('hair') || searchKeyword.includes('salon') || searchKeyword.includes('barber') || searchKeyword.includes('beauty') || searchKeyword.includes('makeup') || searchKeyword.includes('spa')) {
            query.set('or', '(category.ilike.*Beauty*,category.ilike.*Salon*,category.ilike.*Barber*,category.ilike.*Spa*)');
        } else {
            query.set('or', `(name.ilike.*${searchKeyword}*,category.ilike.*${searchKeyword}*)`);
        }
    }

    const url = `${SUPABASE_URL}/rest/v1/vendors?${query.toString()}`;
    console.log('Querying URL:', url);

    const res = await fetch(url, {
        headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
    });

    const data = await res.json();
    console.log('Results Count:', data.length);
    if (data.length > 0) {
        console.log('Sample Result:', JSON.stringify(data[0], null, 2));
    } else {
        // If 0, let's see what categories exist
        const allRes = await fetch(`${SUPABASE_URL}/rest/v1/vendors?select=category&limit=50`, {
            headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });
        const allData = await allRes.json();
        const categories = [...new Set(allData.map(v => v.category))];
        console.log('Available Categories in DB:', categories);
    }
}

debugSearch('plumber');
setTimeout(() => debugSearch('food'), 1000);
