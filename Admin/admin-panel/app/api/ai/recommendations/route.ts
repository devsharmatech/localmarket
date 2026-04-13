import { NextResponse } from 'next/server';
import { supabaseRestGet, supabaseRestUpsert } from '../../../../lib/supabaseAdminFetch';

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function normalizeVendor(v) {
    return {
        id: v.id ?? v.vendor_id,
        name: v.name ?? v.shop_name ?? v.shopName,
        service: v.category ?? v.service ?? 'Service',
        price: 'Contact for price', // Placeholder as price might not be in vendor table
        rating: v.rating || 4.5, // Default/Mock if missing
        distance: '2.5 km', // Mock distance since we don't have geospatial query ready
        eta: 'Available',
        isTopMatch: false, // Logic can be added
        explanation: v.description || `Specialist in ${v.category}`,
    };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { context, location } = body;

        console.log('AI Logic Context:', context);

        // 1. Use Gemini to extract a search keyword from the history
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });

        const historyStr = (context.history || []).map(h => `${h.role}: ${h.content}`).join('\n');

        const prompt = `
        Conversation History:
        ${historyStr}
        
        Task: Based on the conversation above, extract the single most relevant search keyword or category (e.g., "plumber", "medical", "iphone repair", "grocery") to find vendors in a database.
        
        Rules:
        1. Return ONLY the keyword.
        2. Combine terms if necessary (e.g., "laptop repair").
        3. FIX TYPOS.
        
        Return ONLY the keyword.
        `;

        let searchKeyword = 'general';
        try {
            const result = await model.generateContent(prompt);
            const rawText = result.response.text();
            searchKeyword = rawText.trim().replace(/['"]/g, '').toLowerCase();
            console.log('AI Refined Keyword:', searchKeyword);
        } catch (e) {
            console.error('Gemini extraction failed:', e);
            searchKeyword = context.intent || 'general';
        }

        // 2. Validate Keyword
        if (searchKeyword === 'invalid_query') {
            return NextResponse.json({
                vendors: [],
                message: "I'm your Local Market assistant! I can only help you find local vendors and services. Please search for things like home services, food, repairs, or shopping.",
                meta: { filterUsed: 'invalid_query' }
            });
        }

        // 2. Query Supabase using the keyword
        // usage of supabaseRestGet matches logic in api/vendors/route.js
        const query = new URLSearchParams();
        query.set('select', '*');
        query.set('limit', '10');
        query.set('status', 'ilike.*Active*');

        // Search in category or name
        if (searchKeyword !== 'general') {
            if (searchKeyword.includes('plumb')) {
                query.set('category', 'ilike.*Plumbing*');
            } else if (searchKeyword.includes('electric')) {
                query.set('category', 'ilike.*Electrical*');
            } else if (searchKeyword.includes('repair') || searchKeyword.includes('electronic')) {
                query.set('category', 'ilike.*Electronics Repair*');
            } else if (searchKeyword.includes('food') || searchKeyword.includes('restaurant') || searchKeyword.includes('snack') || searchKeyword.includes('hungry') || searchKeyword.includes('craving')) {
                // Include restaurants, snacks, bakery, beverages
                query.set('or', '(category.ilike.*Food*,category.ilike.*Restaurant*,category.ilike.*Snacks*,category.ilike.*Bakery*,category.ilike.*Beverages*)');
            } else if (searchKeyword.includes('clean')) {
                query.set('category', 'ilike.*Cleaning*');
            } else if (searchKeyword.includes('grocery') || searchKeyword.includes('shop') || searchKeyword.includes('groceries') || searchKeyword.includes('buy') || searchKeyword.includes('milk') || searchKeyword.includes('fruit')) {
                // Broad grocery mapping
                query.set('or', '(category.ilike.*Grocery*,category.ilike.*General Store*,category.ilike.*Dairy*,category.ilike.*Fruits*,category.ilike.*Vegetables*,category.ilike.*Spices*)');
            } else if (searchKeyword.includes('medical') || searchKeyword.includes('medicine') || searchKeyword.includes('health') || searchKeyword.includes('pharmacy') || searchKeyword.includes('mediacl')) {
                query.set('category', 'ilike.*Health*');
            } else if (searchKeyword.includes('hair') || searchKeyword.includes('salon') || searchKeyword.includes('barber') || searchKeyword.includes('beauty') || searchKeyword.includes('makeup') || searchKeyword.includes('spa')) {
                // Mapping for beauty and grooming services
                query.set('or', '(category.ilike.*Beauty*,category.ilike.*Salon*,category.ilike.*Barber*,category.ilike.*Spa*)');
            } else {
                // PostgREST OR syntax: or=(col.op.value,col.op.value)
                query.set('or', `(name.ilike.*${searchKeyword}*,category.ilike.*${searchKeyword}*)`);
            }
        }



        const rows = await supabaseRestGet(`/rest/v1/vendors?${query.toString()}`);
        let vendors = Array.isArray(rows) ? rows.map(normalizeVendor) : [];

        // Async log search for analytics/learning
        try {
            await supabaseRestUpsert('/rest/v1/search_logs', [{
                search_query: searchKeyword,
                results_count: vendors.length,
                location_state: context.state || null,
                location_city: context.city || null,
                searched_at: new Date().toISOString()
            }]);
        } catch (logError) {
            console.warn('Failed to log search:', logError);
        }

        // Check if we found anything for the specific search

        if (vendors.length === 0 && searchKeyword !== 'general') {
            return NextResponse.json({
                vendors: [],
                message: `I couldn't find any vendors matching "${searchKeyword}" nearby right now. Would you like to try searching for something else?`,
                meta: {
                    total: 0,
                    filterUsed: searchKeyword
                }
            });
        }

        return NextResponse.json({
            vendors: vendors,
            meta: {
                total: vendors.length,
                filterUsed: searchKeyword
            }
        });

    } catch (error: any) {
        console.error('Recommendations Error:', error);
        if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
            return NextResponse.json({
                vendors: [],
                message: "Syncing vendors... Database is currently unreachable.",
                warning: 'offline_mode'
            });
        }
        return NextResponse.json(
            { error: 'Failed to fetch recommendations', details: error.message },
            { status: 500 }
        );
    }
}
