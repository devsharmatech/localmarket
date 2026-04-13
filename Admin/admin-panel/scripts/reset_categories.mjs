import fetch from 'node-fetch'; // if needed, but fetch is native in Node 18+

const API_BASE = 'http://localhost:3000/api/categories';

const NEW_CATEGORIES = [
    { name: "Supermarket & Groceries", iconName: "ShoppingCart", priority: 1, visible: true },
    { name: "Electronics & Gadgets", iconName: "Smartphone", priority: 2, visible: true },
    { name: "Clothing & Fashion", iconName: "Shirt", priority: 3, visible: true },
    { name: "Home & Kitchen", iconName: "Home", priority: 4, visible: true },
    { name: "Beauty & Personal Care", iconName: "Sparkles", priority: 5, visible: true },
    { name: "Sports & Fitness", iconName: "Dumbbell", priority: 6, visible: true },
    { name: "Health & Wellness", iconName: "Activity", priority: 7, visible: true },
    { name: "Books & Stationery", iconName: "Book", priority: 8, visible: true },
    { name: "Baby & Kids", iconName: "Baby", priority: 9, visible: true },
    { name: "Pet Supplies", iconName: "Heart", priority: 10, visible: true },
    { name: "Automotive & Vehicles", iconName: "Car", priority: 11, visible: true },
    { name: "Tools & Hardware", iconName: "Wrench", priority: 12, visible: true },
    { name: "Toys & Games", iconName: "Gift", priority: 13, visible: true },
    { name: "Professional Services", iconName: "Briefcase", priority: 14, visible: true },
    { name: "Real Estate & Properties", iconName: "Building", priority: 15, visible: true },
    { name: "Restaurants & Food", iconName: "Utensils", priority: 16, visible: true },
    { name: "Medical Services", iconName: "Stethoscope", priority: 17, visible: true },
    { name: "Travel & Tours", iconName: "MapPin", priority: 18, visible: true },
    { name: "Entertainment & Events", iconName: "Ticket", priority: 19, visible: true },
    { name: "Art & Crafts", iconName: "Palette", priority: 20, visible: true },
];

async function run() {
    try {
        console.log('Fetching existing categories...');
        const res = await fetch(API_BASE);
        if (!res.ok) {
            console.error('Failed to fetch categories', await res.text());
            return;
        }
        const data = await res.json();
        const existing = data.categories || [];
        console.log(`Found ${existing.length} existing categories.`);

        console.log('Deleting existing categories...');
        for (const cat of existing) {
            if (cat.id) {
                const delRes = await fetch(`${API_BASE}?id=${cat.id}`, { method: 'DELETE' });
                if (delRes.ok) {
                    console.log(`Deleted: ${cat.name || cat.id}`);
                } else {
                    console.error(`Failed to delete ${cat.name || cat.id}:`, await delRes.text());
                }
            }
        }
        console.log('Finished deleting existing categories.');

        console.log('Inserting new AI-generated categories...');
        const insertRes = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categories: NEW_CATEGORIES })
        });

        if (insertRes.ok) {
            const result = await insertRes.json();
            console.log(`Successfully added new categories! Result:`, result);
        } else {
            console.error('Failed to insert new categories:', await insertRes.text());
        }

    } catch (e) {
        console.error('An error occurred:', e);
    }
}

run();
