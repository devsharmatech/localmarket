import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Load Environment Variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
});

const GEMINI_API_KEY = env.GEMINI_API_KEY;
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

console.log('--- Configuration ---');
console.log('Gemini Key Present:', !!GEMINI_API_KEY);
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key Present:', !!SUPABASE_SERVICE_ROLE_KEY);
console.log('---------------------\n');

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Environment Variables. Check .env.local');
    process.exit(1);
}

// 2. Mock Supabase Fetch
async function supabaseRestGet(pathWithQuery) {
    const url = `${SUPABASE_URL}${pathWithQuery}`;
    console.log(`📡 Querying Supabase: ${url}`);

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`Supabase Error (${res.status}): ${await res.text()}`);
    }
    return await res.json();
}

// 3. Test Logic
async function runTest() {
    console.log('🧪 Starting AI + DB Verification...\n');

    // TEST CASE: "I need a plumber"
    const mockContext = { intent: "plumber", urgency: "high" };
    console.log(`Customer Context: ${JSON.stringify(mockContext)}`);

    // A. Gemini Step
    console.log('🤖 asking Gemini to extract keyword...');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Context: ${JSON.stringify(mockContext)}
    Task: Extract a single, broad search keyword for a database of local vendors.
    Return ONLY the keyword.
    `;

    let searchKeyword = 'general';
    try {
        const result = await model.generateContent(prompt);
        searchKeyword = result.response.text().trim().replace(/['"]/g, '').toLowerCase();
        console.log(`✅ Gemini extracted: "${searchKeyword}"`);
    } catch (e) {
        console.error('❌ Gemini Error:', e.message);
        return;
    }

    // B. Supabase Step
    console.log(`\n🗄️  Searching DB for vendors matching "${searchKeyword}"...`);
    const query = new URLSearchParams();
    query.set('select', 'id,name,category,city'); // Select specific fields for display
    query.set('limit', '5');
    query.set('or', `(name.ilike.*${searchKeyword}*,category.ilike.*${searchKeyword}*)`);

    try {
        const vendors = await supabaseRestGet(`/rest/v1/vendors?${query.toString()}`);
        console.log(`\n✅ Database Results (${vendors.length} matches):`);
        if (vendors.length > 0) {
            console.table(vendors);
        } else {
            console.log('No vendors found. Try a different search term or check if DB has data.');
        }
    } catch (e) {
        console.error('❌ Database Error:', e.message);
    }
}

runTest();
