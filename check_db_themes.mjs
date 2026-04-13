import dotenv from 'dotenv';
import path from 'path';

// Load env from website
dotenv.config({ path: path.resolve(process.cwd(), 'website/.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function checkThemes() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/festival_themes?select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!res.ok) {
            console.error('Error fetching themes:', await res.text());
            return;
        }

        const themes = await res.json();
        console.log('Current Festival Themes in DB:');
        console.log(JSON.stringify(themes, null, 2));

        const activeThemes = themes.filter(t => t.is_active);
        console.log('\nActive Themes:', activeThemes.map(t => t.id));

        // Check users table to see what theme they are assigned
        const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,selected_theme&limit=5`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (userRes.ok) {
            const users = await userRes.json();
            console.log('\nSample Users assigned themes:');
            console.log(JSON.stringify(users, null, 2));
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

checkThemes();
