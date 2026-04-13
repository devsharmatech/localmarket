import fs from 'fs';
import path from 'path';

// Manual env loader for .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
    }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const CATEGORIES = [
    { name: "Restaurants", icon: "Utensils" },
    { name: "Fast Food Centers", icon: "Utensils" },
    { name: "Cafes", icon: "Coffee" },
    { name: "Bakeries", icon: "Utensils" },
    { name: "Sweet Shops", icon: "Gift" },
    { name: "Ice Cream Parlours", icon: "Utensils" },
    { name: "Hotels", icon: "Bed" },
    { name: "Resorts", icon: "Sun" },
    { name: "Guest Houses", icon: "Home" },
    { name: "Lodges", icon: "Home" },
    { name: "Hostels", icon: "Home" },
    { name: "Travel Agents", icon: "MapPin" },
    { name: "Tour Operators", icon: "MapPin" },
    { name: "Taxi Services", icon: "Car" },
    { name: "Car Rental", icon: "Car" },
    { name: "Bus Services", icon: "Truck" },
    { name: "Train Ticket Agents", icon: "Ticket" },
    { name: "Flight Ticket Agents", icon: "Ticket" },
    { name: "Packers and Movers", icon: "Package" },
    { name: "Courier Services", icon: "Mail" },
    { name: "Cargo Services", icon: "Package" },
    { name: "Hospitals", icon: "PlusCircle" },
    { name: "Clinics", icon: "Activity" },
    { name: "Doctors", icon: "User" },
    { name: "Dentists", icon: "Activity" },
    { name: "Eye Clinics", icon: "Eye" },
    { name: "Diagnostic Labs", icon: "Activity" },
    { name: "Pathology Labs", icon: "Activity" },
    { name: "Pharmacies", icon: "PlusCircle" },
    { name: "Medical Stores", icon: "PlusCircle" },
    { name: "Ambulance Services", icon: "Truck" },
    { name: "Physiotherapy Centers", icon: "Activity" },
    { name: "Veterinary Clinics", icon: "Heart" },
    { name: "Pet Hospitals", icon: "Heart" },
    { name: "Schools", icon: "Book" },
    { name: "Colleges", icon: "GraduationCap" },
    { name: "Universities", icon: "Building" },
    { name: "Coaching Centers", icon: "Book" },
    { name: "Tuition Classes", icon: "Book" },
    { name: "Computer Training Institutes", icon: "Monitor" },
    { name: "Language Classes", icon: "MessageCircle" },
    { name: "Music Classes", icon: "Music" },
    { name: "Dance Classes", icon: "Music" },
    { name: "Sports Academies", icon: "Trophy" },
    { name: "Driving Schools", icon: "Car" },
    { name: "Libraries", icon: "Book" },
    { name: "Book Stores", icon: "Book" },
    { name: "Stationery Shops", icon: "Edit" },
    { name: "Electronics Stores", icon: "Tv" },
    { name: "Mobile Phone Shops", icon: "Smartphone" },
    { name: "Computer Shops", icon: "Monitor" },
    { name: "Laptop Repair Services", icon: "Tool" },
    { name: "Mobile Repair Shops", icon: "Tool" },
    { name: "TV Repair Services", icon: "Tool" },
    { name: "AC Repair Services", icon: "Wind" },
    { name: "Refrigerator Repair", icon: "Tool" },
    { name: "Washing Machine Repair", icon: "Tool" },
    { name: "Water Purifier Services", icon: "Droplet" },
    { name: "CCTV Dealers", icon: "Camera" },
    { name: "Security System Dealers", icon: "Lock" },
    { name: "Internet Service Providers", icon: "Zap" },
    { name: "Cable TV Operators", icon: "Tv" },
    { name: "Cyber Cafes", icon: "Monitor" },
    { name: "Electricians", icon: "Zap" },
    { name: "Plumbers", icon: "Droplet" },
    { name: "Carpenters", icon: "Tool" },
    { name: "Painters", icon: "Palette" },
    { name: "Pest Control Services", icon: "Shield" },
    { name: "Cleaning Services", icon: "Star" },
    { name: "Housekeeping Services", icon: "Home" },
    { name: "Interior Designers", icon: "Palette" },
    { name: "Architects", icon: "Map" },
    { name: "Building Contractors", icon: "Tool" },
    { name: "Construction Companies", icon: "Building" },
    { name: "Building Material Suppliers", icon: "Layers" },
    { name: "Hardware Stores", icon: "Wrench" },
    { name: "Paint Stores", icon: "Palette" },
    { name: "Furniture Stores", icon: "Sofa" },
    { name: "Mattress Stores", icon: "Bed" },
    { name: "Home Decor Stores", icon: "Home" },
    { name: "Kitchen Appliance Stores", icon: "Utensils" },
    { name: "Grocery Stores", icon: "ShoppingCart" },
    { name: "Supermarkets", icon: "ShoppingBag" },
    { name: "Departmental Stores", icon: "ShoppingBag" },
    { name: "Clothing Stores", icon: "Shirt" },
    { name: "Men's Wear Shops", icon: "Shirt" },
    { name: "Women's Wear Shops", icon: "Shirt" },
    { name: "Kids Wear Stores", icon: "Baby" },
    { name: "Shoe Stores", icon: "Circle" },
    { name: "Bag Stores", icon: "ShoppingBag" },
    { name: "Jewellery Shops", icon: "Star" },
    { name: "Watch Stores", icon: "Clock" },
    { name: "Cosmetic Stores", icon: "Sparkles" },
    { name: "Gift Shops", icon: "Gift" },
    { name: "Toy Stores", icon: "Gift" },
    { name: "Florists", icon: "Flower" },
    { name: "Event Management Companies", icon: "Calendar" },
    { name: "Wedding Planners", icon: "Heart" },
    { name: "Caterers", icon: "Utensils" },
    { name: "Photographers", icon: "Camera" },
    { name: "Videographers", icon: "Camera" },
    { name: "DJ Services", icon: "Music" },
    { name: "Tent Houses", icon: "Home" },
    { name: "Decoration Services", icon: "Sparkles" },
    { name: "Beauty Parlours", icon: "Scissors" },
    { name: "Hair Salons", icon: "Scissors" },
    { name: "Spas", icon: "Droplet" },
    { name: "Tattoo Studios", icon: "Edit" },
    { name: "Nail Art Studios", icon: "Star" },
    { name: "Gyms", icon: "Dumbbell" },
    { name: "Fitness Centers", icon: "Activity" },
    { name: "Yoga Classes", icon: "Activity" },
    { name: "Meditation Centers", icon: "Activity" },
    { name: "Dance Studios", icon: "Music" },
    { name: "Sports Clubs", icon: "Trophy" },
    { name: "Cricket Academies", icon: "Trophy" },
    { name: "Football Academies", icon: "Trophy" },
    { name: "Swimming Pools", icon: "Droplet" },
    { name: "Adventure Sports", icon: "Sun" },
    { name: "Amusement Parks", icon: "Star" },
    { name: "Movie Theatres", icon: "Tv" },
    { name: "Gaming Zones", icon: "Gamepad" },
    { name: "Internet Gaming Cafes", icon: "Monitor" },
    { name: "Banks", icon: "CreditCard" },
    { name: "ATMs", icon: "CreditCard" },
    { name: "Insurance Agents", icon: "Shield" },
    { name: "Loan Consultants", icon: "CreditCard" },
    { name: "Finance Companies", icon: "CreditCard" },
    { name: "Investment Advisors", icon: "TrendingUp" },
    { name: "Chartered Accountants", icon: "FileText" },
    { name: "Tax Consultants", icon: "FileText" },
    { name: "Lawyers", icon: "Shield" },
    { name: "Notary Services", icon: "FileText" },
    { name: "Real Estate Agents", icon: "Building" },
    { name: "Property Dealers", icon: "Home" },
    { name: "Builders and Developers", icon: "Building" },
    { name: "Land Surveyors", icon: "MapPin" },
    { name: "Property Valuers", icon: "FileText" },
    { name: "PG Accommodations", icon: "Home" },
    { name: "Rental Apartments", icon: "Building" },
    { name: "Hostels for Students", icon: "Home" },
    { name: "Car Dealers", icon: "Car" },
    { name: "Used Car Dealers", icon: "Car" },
    { name: "Bike Dealers", icon: "Circle" },
    { name: "Used Bike Dealers", icon: "Circle" },
    { name: "Car Repair Workshops", icon: "Tool" },
    { name: "Bike Repair Workshops", icon: "Tool" },
    { name: "Car Accessories Shops", icon: "Settings" },
    { name: "Tyre Dealers", icon: "Circle" },
    { name: "Car Wash Services", icon: "Droplet" },
    { name: "Petrol Pumps", icon: "Droplet" },
    { name: "EV Charging Stations", icon: "Zap" },
    { name: "Towing Services", icon: "Truck" },
    { name: "Scrap Dealers", icon: "Trash" },
    { name: "Recycling Centers", icon: "Trash" },
    { name: "Printing Services", icon: "FileText" },
    { name: "Photocopy Shops", icon: "Copy" },
    { name: "Flex Printing", icon: "Image" },
    { name: "Advertising Agencies", icon: "Bell" },
    { name: "Digital Marketing Agencies", icon: "Activity" },
    { name: "Web Design Companies", icon: "Layers" },
    { name: "Software Companies", icon: "Monitor" },
    { name: "IT Services", icon: "Tool" },
    { name: "Data Recovery Services", icon: "Box" },
    { name: "Security Guard Services", icon: "Shield" },
    { name: "Detective Agencies", icon: "Eye" },
    { name: "House Shifting Services", icon: "Package" },
    { name: "Laundry Services", icon: "Droplet" },
    { name: "Dry Cleaners", icon: "Droplet" },
    { name: "Tailors", icon: "Scissors" },
    { name: "Boutique Shops", icon: "ShoppingBag" },
    { name: "Embroidery Services", icon: "Star" },
    { name: "Handicraft Shops", icon: "Image" },
    { name: "Art Galleries", icon: "Image" },
    { name: "Antique Shops", icon: "Star" },
    { name: "Musical Instrument Shops", icon: "Music" },
    { name: "Instrument Repair Services", icon: "Tool" },
    { name: "Pet Shops", icon: "Heart" },
    { name: "Pet Grooming Services", icon: "Heart" },
    { name: "Pet Boarding Services", icon: "Home" },
    { name: "Dairy Shops", icon: "Droplet" },
    { name: "Meat Shops", icon: "Circle" },
    { name: "Fish Shops", icon: "Circle" },
    { name: "Organic Food Stores", icon: "Leaf" },
    { name: "Health Food Stores", icon: "Activity" },
    { name: "Herbal Stores", icon: "Leaf" },
    { name: "Agricultural Equipment Dealers", icon: "Tool" },
    { name: "Seed Stores", icon: "Circle" },
    { name: "Fertilizer Shops", icon: "Box" },
    { name: "Plant Nurseries", icon: "Flower" },
    { name: "Garden Services", icon: "Sun" },
    { name: "Landscaping Services", icon: "Map" },
    { name: "Water Tank Cleaning", icon: "Droplet" },
    { name: "Borewell Services", icon: "Tool" },
    { name: "Solar Panel Dealers", icon: "Sun" },
    { name: "Battery Dealers", icon: "Zap" },
    { name: "Generator Dealers", icon: "Zap" },
    { name: "Welding Services", icon: "Tool" },
    { name: "Glass Dealers", icon: "Square" },
    { name: "Aluminium Fabricators", icon: "Layers" },
    { name: "Steel Fabricators", icon: "Layers" },
    { name: "Roofing Contractors", icon: "Home" },
    { name: "Roadside Assistance", icon: "Truck" },
    { name: "Logistics Companies", icon: "Truck" },
    { name: "Warehouse Services", icon: "Package" }
];

async function run() {
    try {
        console.log('--- Database Reset Start ---');

        // 1. Delete all existing categories
        console.log('Deleting existing categories...');
        const delRes = await fetch(`${SUPABASE_URL}/rest/v1/categories?id=not.is.null`, {
            method: 'DELETE',
            headers: {
                apikey: SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });

        if (!delRes.ok) {
            console.error('Failed to clear categories:', await delRes.text());
            // Continue anyway? Or stop?
        } else {
            console.log('Existing categories cleared.');
        }

        // 2. Prepare data for insertion
        const toInsert = CATEGORIES.map((cat, index) => ({
            name: cat.name,
            icon_name: cat.icon,
            priority: index + 1,
            visible: true
        }));

        // 3. Insert in chunks of 50 to avoid any potential limits
        const chunkSize = 50;
        for (let i = 0; i < toInsert.length; i += chunkSize) {
            const chunk = toInsert.slice(i, i + chunkSize);
            console.log(`Inserting chunk ${i / chunkSize + 1}...`);
            const insRes = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
                method: 'POST',
                headers: {
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(chunk)
            });

            if (!insRes.ok) {
                console.error(`Failed to insert chunk ${i / chunkSize + 1}:`, await insRes.text());
            } else {
                console.log(`Inserted ${chunk.length} categories.`);
            }
        }

        console.log('--- Database Reset Complete ---');
        console.log(`Successfully processed ${CATEGORIES.length} categories.`);

    } catch (e) {
        console.error('An unexpected error occurred:', e);
    }
}

run();
