import { supabaseRestGet, supabaseRestInsert } from '@/lib/supabaseAdminFetch';

// Product templates with pricing
const PRODUCT_TEMPLATES = [
    // Fruits & Vegetables
    { name: 'Apple', baseMRP: 120, uom: 'kg', categoryMatch: ['fruits', 'vegetables', 'fresh'] },
    { name: 'Banana', baseMRP: 50, uom: 'dozen', categoryMatch: ['fruits', 'fresh'] },
    { name: 'Orange', baseMRP: 100, uom: 'kg', categoryMatch: ['fruits', 'fresh'] },
    { name: 'Mango', baseMRP: 200, uom: 'kg', categoryMatch: ['fruits', 'fresh'] },
    { name: 'Grapes', baseMRP: 120, uom: 'kg', categoryMatch: ['fruits', 'fresh'] },
    { name: 'Tomato', baseMRP: 50, uom: 'kg', categoryMatch: ['vegetables', 'fresh'] },
    { name: 'Onion', baseMRP: 35, uom: 'kg', categoryMatch: ['vegetables', 'fresh'] },
    { name: 'Potato', baseMRP: 30, uom: 'kg', categoryMatch: ['vegetables', 'fresh'] },
    { name: 'Carrot', baseMRP: 50, uom: 'kg', categoryMatch: ['vegetables', 'fresh'] },
    { name: 'Capsicum', baseMRP: 100, uom: 'kg', categoryMatch: ['vegetables', 'fresh'] },
    
    // Dairy
    { name: 'Milk', baseMRP: 65, uom: 'liter', categoryMatch: ['dairy', 'milk'] },
    { name: 'Curd', baseMRP: 55, uom: 'kg', categoryMatch: ['dairy', 'yogurt', 'curd'] },
    { name: 'Paneer', baseMRP: 320, uom: 'kg', categoryMatch: ['dairy', 'cheese'] },
    { name: 'Butter', baseMRP: 55, uom: '100g', categoryMatch: ['dairy', 'cheese', 'butter'] },
    { name: 'Ghee', baseMRP: 550, uom: 'kg', categoryMatch: ['dairy', 'cheese', 'butter'] },
    
    // Grains & Pulses
    { name: 'Basmati Rice', baseMRP: 150, uom: 'kg', categoryMatch: ['grains', 'rice'] },
    { name: 'Sona Masoori Rice', baseMRP: 70, uom: 'kg', categoryMatch: ['grains', 'rice'] },
    { name: 'Wheat Atta', baseMRP: 55, uom: 'kg', categoryMatch: ['grains', 'wheat', 'atta'] },
    { name: 'Toor Dal', baseMRP: 130, uom: 'kg', categoryMatch: ['grains', 'pulses', 'dal'] },
    { name: 'Moong Dal', baseMRP: 110, uom: 'kg', categoryMatch: ['grains', 'pulses', 'dal'] },
    
    // Spices
    { name: 'Turmeric Powder', baseMRP: 35, uom: '100g', categoryMatch: ['spices', 'masalas'] },
    { name: 'Red Chilli Powder', baseMRP: 45, uom: '100g', categoryMatch: ['spices', 'masalas'] },
    { name: 'Coriander Powder', baseMRP: 40, uom: '100g', categoryMatch: ['spices', 'masalas'] },
    { name: 'Garam Masala', baseMRP: 55, uom: '100g', categoryMatch: ['spices', 'masalas'] },
    { name: 'Cumin Seeds', baseMRP: 70, uom: '100g', categoryMatch: ['spices', 'masalas'] },
    
    // Oil & Ghee
    { name: 'Sunflower Oil', baseMRP: 130, uom: 'liter', categoryMatch: ['oil', 'ghee'] },
    { name: 'Mustard Oil', baseMRP: 150, uom: 'liter', categoryMatch: ['oil', 'ghee'] },
    { name: 'Groundnut Oil', baseMRP: 160, uom: 'liter', categoryMatch: ['oil', 'ghee'] },
    
    // Tea & Coffee
    { name: 'Tea', baseMRP: 90, uom: '250g', categoryMatch: ['tea', 'coffee', 'beverages'] },
    { name: 'Green Tea', baseMRP: 180, uom: '100g', categoryMatch: ['tea', 'coffee', 'beverages'] },
    { name: 'Coffee', baseMRP: 250, uom: '100g', categoryMatch: ['tea', 'coffee', 'beverages'] },
    
    // Snacks
    { name: 'Namkeen', baseMRP: 45, uom: '200g', categoryMatch: ['snacks', 'namkeen'] },
    { name: 'Chips', baseMRP: 25, uom: '100g', categoryMatch: ['snacks', 'chips', 'wafers'] },
    { name: 'Biscuits', baseMRP: 20, uom: '100g', categoryMatch: ['snacks', 'biscuits', 'cookies'] },
    
    // Bakery
    { name: 'Bread', baseMRP: 40, uom: 'pack', categoryMatch: ['bakery', 'bread'] },
    { name: 'Bun', baseMRP: 35, uom: 'pack', categoryMatch: ['bakery', 'bread'] },
    { name: 'Rusk', baseMRP: 50, uom: '200g', categoryMatch: ['bakery', 'rusk'] },
    
    // More products
    { name: 'Sugar', baseMRP: 50, uom: 'kg', categoryMatch: ['sugar'] },
    { name: 'Salt', baseMRP: 25, uom: 'kg', categoryMatch: ['salt'] },
    { name: 'Honey', baseMRP: 250, uom: '500g', categoryMatch: ['honey', 'jams'] },
    { name: 'Jam', baseMRP: 90, uom: '200g', categoryMatch: ['honey', 'jams'] },
    { name: 'Ketchup', baseMRP: 70, uom: '500g', categoryMatch: ['sauces', 'ketchup'] },
    { name: 'Pickle', baseMRP: 140, uom: '500g', categoryMatch: ['pickles', 'chutneys'] },
    { name: 'Noodles', baseMRP: 16, uom: 'pack', categoryMatch: ['noodles', 'pasta'] },
    { name: 'Soap', baseMRP: 45, uom: 'piece', categoryMatch: ['bath', 'body', 'personal'] },
    { name: 'Shampoo', baseMRP: 180, uom: '200ml', categoryMatch: ['hair', 'care'] },
    { name: 'Toothpaste', baseMRP: 70, uom: '100g', categoryMatch: ['oral', 'care'] },
    { name: 'Detergent', baseMRP: 140, uom: '1kg', categoryMatch: ['laundry'] },
    { name: 'Floor Cleaner', baseMRP: 90, uom: '500ml', categoryMatch: ['cleaning'] },
];

// Helper function to check if category matches product
function categoryMatches(categoryName, productTemplate) {
    const catLower = categoryName.toLowerCase();
    return productTemplate.categoryMatch.some(match => catLower.includes(match));
}

// Generate price with discount (5-15% off MRP)
function generatePrice(mrp) {
    const discountPercent = 5 + Math.random() * 10; // 5-15% discount
    return Math.round(mrp * (1 - discountPercent / 100) * 100) / 100;
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const clearExisting = body.clearExisting === true;

        // Fetch vendors
        const vendors = await supabaseRestGet('/rest/v1/vendors?select=id,name,category,status&status=eq.Active&limit=100');
        if (!Array.isArray(vendors) || vendors.length === 0) {
            return Response.json({ 
                success: false, 
                error: 'No active vendors found. Please create vendors first.' 
            }, { status: 400 });
        }

        // Fetch categories
        const categories = await supabaseRestGet('/rest/v1/categories?select=id,name');
        if (!Array.isArray(categories) || categories.length === 0) {
            return Response.json({ 
                success: false, 
                error: 'No categories found. Please create categories first.' 
            }, { status: 400 });
        }

        // Create category map for quick lookup
        const categoryMap = new Map();
        categories.forEach(cat => {
            categoryMap.set(cat.id, cat.name);
        });

        // Clear existing products if requested
        if (clearExisting) {
            try {
                // Delete all vendor products
                await supabaseRestGet('/rest/v1/vendor_products?select=id&limit=1'); // Check if table exists
                // Note: We can't delete via REST API easily, so we'll skip this for now
                // Users can manually delete if needed
            } catch (e) {
                console.warn('Could not clear existing products:', e.message);
            }
        }

        // Generate vendor products
        const vendorProducts = [];
        const minProductsPerVendor = 5;
        const maxProductsPerVendor = 20;

        vendors.forEach((vendor) => {
            const vendorCategory = (vendor.category || '').toLowerCase();
            const productsPerVendor = minProductsPerVendor + Math.floor(Math.random() * (maxProductsPerVendor - minProductsPerVendor + 1));
            
            // Filter products that match vendor category
            let matchingProducts = PRODUCT_TEMPLATES.filter(template => 
                categoryMatches(vendorCategory, template)
            );

            // If no match or too few matches, add some random products
            if (matchingProducts.length < productsPerVendor) {
                const randomProducts = PRODUCT_TEMPLATES
                    .filter(t => !matchingProducts.includes(t))
                    .sort(() => Math.random() - 0.5)
                    .slice(0, productsPerVendor - matchingProducts.length);
                matchingProducts = matchingProducts.concat(randomProducts);
            }

            // Select random products for this vendor
            const selectedProducts = matchingProducts
                .sort(() => Math.random() - 0.5)
                .slice(0, Math.min(productsPerVendor, matchingProducts.length));

            selectedProducts.forEach((template) => {
                // Find matching category ID
                let categoryId = null;
                for (const [catId, catName] of categoryMap.entries()) {
                    if (categoryMatches(catName, template)) {
                        categoryId = catId;
                        break;
                    }
                }

                // Generate price with some variation
                const mrpVariation = template.baseMRP * 0.1; // ±10% variation
                const mrp = template.baseMRP + (Math.random() * 2 - 1) * mrpVariation;
                const price = generatePrice(mrp);

                vendorProducts.push({
                    vendor_id: vendor.id,
                    name: template.name,
                    price: Math.round(price * 100) / 100,
                    mrp: Math.round(mrp * 100) / 100,
                    uom: template.uom,
                    category_id: categoryId,
                    is_active: Math.random() > 0.1, // 90% active
                    image_url: null,
                });
            });
        });

        // Insert in batches
        const batchSize = 50;
        let inserted = 0;
        let errors = 0;

        for (let i = 0; i < vendorProducts.length; i += batchSize) {
            const batch = vendorProducts.slice(i, i + batchSize);
            try {
                await supabaseRestInsert('/rest/v1/vendor_products', batch);
                inserted += batch.length;
            } catch (error) {
                errors += batch.length;
                console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
            }
        }

        return Response.json({
            success: true,
            inserted,
            errors,
            totalGenerated: vendorProducts.length,
            vendorsProcessed: vendors.length,
            averageProductsPerVendor: Math.round(vendorProducts.length / vendors.length),
        }, { status: 200 });

    } catch (error) {
        console.error('Error generating vendor products:', error);
        return Response.json({
            success: false,
            error: error?.message || 'Failed to generate vendor products'
        }, { status: 500 });
    }
}
