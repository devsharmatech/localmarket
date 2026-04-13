import { supabaseRestGet } from './website/lib/supabaseAdminFetch';

async function testQuery() {
    const marketName = 'FASHION STREERT';
    const query = `/rest/v1/vendors?or=(sub_tehsil.ilike.*${marketName}*,circle.ilike.*${marketName}*,town.ilike.*${marketName}*,name.ilike.*FASHION*)&select=*`;
    
    console.log('Querying:', query);
    try {
        const res = await supabaseRestGet(query);
        console.log('Results:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

testQuery();
