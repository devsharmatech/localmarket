const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create output directory
const outputDir = path.join(__dirname, '../public/dummy-data');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Common image URLs (using placeholder services and real product images)
const imageUrls = {
    categories: [
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400', // Fruits
        'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400', // Vegetables
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400', // Dairy
        'https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=400', // Bakery
        'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400', // Beverages
        'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400', // Snacks
        'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400', // Spices
        'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400', // Grains
    ],
    products: [
        'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
        'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400',
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
        'https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=400',
        'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400',
        'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
        'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400',
    ]
};

// Generate Categories Data (100+ categories)
function generateCategories() {
    const categories = [
        // Fruits & Vegetables
        { name: 'Fruits & Vegetables', id: 'fruits_vegetables', priority: 1, visible: true, iconName: 'fruits', iconUrl: imageUrls.categories[0] },
        { name: 'Fresh Fruits', id: 'fresh_fruits', priority: 2, visible: true, iconName: 'apple', iconUrl: imageUrls.categories[0] },
        { name: 'Fresh Vegetables', id: 'fresh_vegetables', priority: 3, visible: true, iconName: 'vegetables', iconUrl: imageUrls.categories[1] },
        { name: 'Exotic Fruits', id: 'exotic_fruits', priority: 4, visible: true, iconName: 'exotic', iconUrl: imageUrls.categories[0] },
        { name: 'Leafy Vegetables', id: 'leafy_vegetables', priority: 5, visible: true, iconName: 'leafy', iconUrl: imageUrls.categories[1] },

        // Dairy & Eggs
        { name: 'Dairy & Eggs', id: 'dairy_eggs', priority: 6, visible: true, iconName: 'dairy', iconUrl: imageUrls.categories[2] },
        { name: 'Milk & Milk Products', id: 'milk_products', priority: 7, visible: true, iconName: 'milk', iconUrl: imageUrls.categories[2] },
        { name: 'Cheese & Butter', id: 'cheese_butter', priority: 8, visible: true, iconName: 'cheese', iconUrl: imageUrls.categories[2] },
        { name: 'Yogurt & Curd', id: 'yogurt_curd', priority: 9, visible: true, iconName: 'yogurt', iconUrl: imageUrls.categories[2] },
        { name: 'Eggs', id: 'eggs', priority: 10, visible: true, iconName: 'eggs', iconUrl: imageUrls.categories[2] },

        // Bakery
        { name: 'Bakery', id: 'bakery', priority: 11, visible: true, iconName: 'bakery', iconUrl: imageUrls.categories[3] },
        { name: 'Bread & Buns', id: 'bread_buns', priority: 12, visible: true, iconName: 'bread', iconUrl: imageUrls.categories[3] },
        { name: 'Cakes & Pastries', id: 'cakes_pastries', priority: 13, visible: true, iconName: 'cake', iconUrl: imageUrls.categories[3] },
        { name: 'Cookies & Biscuits', id: 'cookies_biscuits', priority: 14, visible: true, iconName: 'cookies', iconUrl: imageUrls.categories[3] },
        { name: 'Rusk & Khari', id: 'rusk_khari', priority: 15, visible: true, iconName: 'rusk', iconUrl: imageUrls.categories[3] },

        // Beverages
        { name: 'Beverages', id: 'beverages', priority: 16, visible: true, iconName: 'beverages', iconUrl: imageUrls.categories[4] },
        { name: 'Tea & Coffee', id: 'tea_coffee', priority: 17, visible: true, iconName: 'tea', iconUrl: imageUrls.categories[4] },
        { name: 'Soft Drinks', id: 'soft_drinks', priority: 18, visible: true, iconName: 'drinks', iconUrl: imageUrls.categories[4] },
        { name: 'Juices', id: 'juices', priority: 19, visible: true, iconName: 'juice', iconUrl: imageUrls.categories[4] },
        { name: 'Energy Drinks', id: 'energy_drinks', priority: 20, visible: true, iconName: 'energy', iconUrl: imageUrls.categories[4] },

        // Snacks
        { name: 'Snacks & Namkeen', id: 'snacks_namkeen', priority: 21, visible: true, iconName: 'snacks', iconUrl: imageUrls.categories[5] },
        { name: 'Chips & Wafers', id: 'chips_wafers', priority: 22, visible: true, iconName: 'chips', iconUrl: imageUrls.categories[5] },
        { name: 'Nuts & Dry Fruits', id: 'nuts_dryfruits', priority: 23, visible: true, iconName: 'nuts', iconUrl: imageUrls.categories[5] },
        { name: 'Sweets & Mithai', id: 'sweets_mithai', priority: 24, visible: true, iconName: 'sweets', iconUrl: imageUrls.categories[5] },
        { name: 'Chocolates', id: 'chocolates', priority: 25, visible: true, iconName: 'chocolate', iconUrl: imageUrls.categories[5] },

        // Spices & Masalas
        { name: 'Spices & Masalas', id: 'spices_masalas', priority: 26, visible: true, iconName: 'spices', iconUrl: imageUrls.categories[6] },
        { name: 'Whole Spices', id: 'whole_spices', priority: 27, visible: true, iconName: 'whole_spices', iconUrl: imageUrls.categories[6] },
        { name: 'Powdered Spices', id: 'powdered_spices', priority: 28, visible: true, iconName: 'powder', iconUrl: imageUrls.categories[6] },
        { name: 'Garam Masala', id: 'garam_masala', priority: 29, visible: true, iconName: 'garam', iconUrl: imageUrls.categories[6] },
        { name: 'Ready Mix Masalas', id: 'ready_mix_masalas', priority: 30, visible: true, iconName: 'ready_mix', iconUrl: imageUrls.categories[6] },

        // Grains & Pulses
        { name: 'Grains & Pulses', id: 'grains_pulses', priority: 31, visible: true, iconName: 'grains', iconUrl: imageUrls.categories[7] },
        { name: 'Rice & Rice Products', id: 'rice_products', priority: 32, visible: true, iconName: 'rice', iconUrl: imageUrls.categories[7] },
        { name: 'Wheat & Atta', id: 'wheat_atta', priority: 33, visible: true, iconName: 'wheat', iconUrl: imageUrls.categories[7] },
        { name: 'Dal & Pulses', id: 'dal_pulses', priority: 34, visible: true, iconName: 'dal', iconUrl: imageUrls.categories[7] },
        { name: 'Flour & Maida', id: 'flour_maida', priority: 35, visible: true, iconName: 'flour', iconUrl: imageUrls.categories[7] },
    ];

    // Add more categories to reach 100+
    const additionalCategories = [
        'Oil & Ghee', 'Pickles & Chutneys', 'Sauces & Ketchup', 'Honey & Jams', 'Breakfast Cereals',
        'Frozen Foods', 'Ice Cream', 'Baby Food', 'Pet Food', 'Personal Care',
        'Hair Care', 'Skin Care', 'Oral Care', 'Bath & Body', 'Men\'s Grooming',
        'Women\'s Hygiene', 'Home Care', 'Laundry', 'Cleaning', 'Pooja Items',
        'Stationery', 'Kitchen Essentials', 'Utensils', 'Storage', 'Electrical',
        'Lighting', 'Home Decor', 'Garden', 'Tools', 'Hardware',
        'Automotive', 'Sports', 'Toys', 'Books', 'Electronics',
        'Mobile Accessories', 'Computer Accessories', 'Gaming', 'Cameras', 'Audio',
        'Wearables', 'Smart Home', 'Fitness', 'Yoga', 'Meditation',
        'Organic', 'Ayurvedic', 'Herbal', 'Supplements', 'Vitamins',
        'Protein', 'Health Drinks', 'Diet Foods', 'Sugar Free', 'Gluten Free',
        'Vegan', 'Vegetarian', 'Non-Vegetarian', 'Seafood', 'Meat',
        'Poultry', 'Ready to Eat', 'Instant Mixes', 'Noodles & Pasta', 'Soups',
        'Canned Foods', 'Preserved', 'Dried Foods', 'Seeds', 'Herbs',
        'Tea Varieties', 'Coffee Varieties', 'Green Tea', 'Herbal Tea', 'Kashmiri Tea',
        'Gift Hampers', 'Party Supplies', 'Festival Special', 'Seasonal', 'Regional Specials'
    ];

    let priority = 36;
    additionalCategories.forEach((catName, idx) => {
        const id = catName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        categories.push({
            name: catName,
            id: id,
            priority: priority++,
            visible: true,
            iconName: id,
            iconUrl: imageUrls.categories[idx % imageUrls.categories.length]
        });
    });

    return categories;
}

// Generate Master Products Data (100+ products)
function generateMasterProducts() {
    const products = [];

    const productTemplates = [
        // Fruits
        { base: 'Apple', brands: ['Kashmiri', 'Himachal', 'Washington'], uom: 'kg', mrp: [120, 150, 180], category: 'fresh_fruits' },
        { base: 'Banana', brands: ['Robusta', 'Cavendish', 'Yelakki'], uom: 'dozen', mrp: [40, 50, 60], category: 'fresh_fruits' },
        { base: 'Orange', brands: ['Nagpur', 'Kinnow', 'Sweet'], uom: 'kg', mrp: [80, 100, 120], category: 'fresh_fruits' },
        { base: 'Mango', brands: ['Alphonso', 'Kesar', 'Dasheri'], uom: 'kg', mrp: [150, 200, 250], category: 'fresh_fruits' },
        { base: 'Grapes', brands: ['Green', 'Black', 'Red'], uom: 'kg', mrp: [100, 120, 140], category: 'fresh_fruits' },

        // Vegetables
        { base: 'Tomato', brands: ['Local', 'Hybrid', 'Organic'], uom: 'kg', mrp: [40, 50, 60], category: 'fresh_vegetables' },
        { base: 'Onion', brands: ['Red', 'White', 'Yellow'], uom: 'kg', mrp: [30, 35, 40], category: 'fresh_vegetables' },
        { base: 'Potato', brands: ['Local', 'Baby', 'Sweet'], uom: 'kg', mrp: [25, 30, 35], category: 'fresh_vegetables' },
        { base: 'Carrot', brands: ['Red', 'Orange', 'Baby'], uom: 'kg', mrp: [40, 50, 60], category: 'fresh_vegetables' },
        { base: 'Capsicum', brands: ['Green', 'Red', 'Yellow'], uom: 'kg', mrp: [80, 100, 120], category: 'fresh_vegetables' },

        // Dairy
        { base: 'Milk', brands: ['Amul', 'Mother Dairy', 'Heritage'], uom: 'liter', mrp: [60, 65, 70], category: 'milk_products' },
        { base: 'Curd', brands: ['Amul', 'Mother Dairy', 'Nestle'], uom: 'kg', mrp: [50, 55, 60], category: 'yogurt_curd' },
        { base: 'Paneer', brands: ['Amul', 'Mother Dairy', 'Local'], uom: 'kg', mrp: [300, 320, 350], category: 'cheese_butter' },
        { base: 'Butter', brands: ['Amul', 'Mother Dairy', 'Britannia'], uom: '100g', mrp: [50, 55, 60], category: 'cheese_butter' },
        { base: 'Ghee', brands: ['Amul', 'Mother Dairy', 'Aashirvaad'], uom: 'kg', mrp: [500, 550, 600], category: 'cheese_butter' },

        // Grains
        { base: 'Basmati Rice', brands: ['India Gate', 'Kohinoor', 'Tilda'], uom: 'kg', mrp: [120, 150, 200], category: 'rice_products' },
        { base: 'Sona Masoori Rice', brands: ['India Gate', 'Kohinoor', 'Local'], uom: 'kg', mrp: [60, 70, 80], category: 'rice_products' },
        { base: 'Wheat Atta', brands: ['Aashirvaad', 'Pillsbury', 'Fortune'], uom: 'kg', mrp: [50, 55, 60], category: 'wheat_atta' },
        { base: 'Toor Dal', brands: ['Tata', 'Fortune', 'Local'], uom: 'kg', mrp: [120, 130, 140], category: 'dal_pulses' },
        { base: 'Moong Dal', brands: ['Tata', 'Fortune', 'Local'], uom: 'kg', mrp: [100, 110, 120], category: 'dal_pulses' },

        // Spices
        { base: 'Turmeric Powder', brands: ['Everest', 'MDH', 'Catch'], uom: '100g', mrp: [30, 35, 40], category: 'powdered_spices' },
        { base: 'Red Chilli Powder', brands: ['Everest', 'MDH', 'Catch'], uom: '100g', mrp: [40, 45, 50], category: 'powdered_spices' },
        { base: 'Coriander Powder', brands: ['Everest', 'MDH', 'Catch'], uom: '100g', mrp: [35, 40, 45], category: 'powdered_spices' },
        { base: 'Garam Masala', brands: ['Everest', 'MDH', 'Catch'], uom: '100g', mrp: [50, 55, 60], category: 'garam_masala' },
        { base: 'Cumin Seeds', brands: ['Everest', 'MDH', 'Catch'], uom: '100g', mrp: [60, 70, 80], category: 'whole_spices' },

        // Oil
        { base: 'Sunflower Oil', brands: ['Fortune', 'Saffola', 'Dhara'], uom: 'liter', mrp: [120, 130, 140], category: 'oil_ghee' },
        { base: 'Mustard Oil', brands: ['Fortune', 'Dhara', 'Local'], uom: 'liter', mrp: [140, 150, 160], category: 'oil_ghee' },
        { base: 'Groundnut Oil', brands: ['Fortune', 'Saffola', 'Dhara'], uom: 'liter', mrp: [150, 160, 170], category: 'oil_ghee' },

        // Tea & Coffee
        { base: 'Tea', brands: ['Tata Tea', 'Red Label', 'Taj Mahal'], uom: '250g', mrp: [80, 90, 100], category: 'tea_coffee' },
        { base: 'Green Tea', brands: ['Tata', 'Tetley', 'Organic India'], uom: '100g', mrp: [150, 180, 200], category: 'tea_coffee' },
        { base: 'Coffee', brands: ['Nescafe', 'Bru', 'Davidoff'], uom: '100g', mrp: [200, 250, 300], category: 'tea_coffee' },

        // Snacks
        { base: 'Namkeen', brands: ['Haldiram', 'Bikaji', 'Kurkure'], uom: '200g', mrp: [40, 45, 50], category: 'snacks_namkeen' },
        { base: 'Chips', brands: ['Lays', 'Kurkure', 'Haldiram'], uom: '100g', mrp: [20, 25, 30], category: 'chips_wafers' },
        { base: 'Biscuits', brands: ['Parle-G', 'Britannia', 'Oreo'], uom: '100g', mrp: [15, 20, 25], category: 'cookies_biscuits' },

        // More products to reach 100+
        { base: 'Sugar', brands: ['Madhur', 'Parry\'s', 'Local'], uom: 'kg', mrp: [45, 50, 55], category: 'sugar' },
        { base: 'Salt', brands: ['Tata', 'Aashirvaad', 'Local'], uom: 'kg', mrp: [20, 25, 30], category: 'salt' },
        { base: 'Honey', brands: ['Dabur', 'Zandu', 'Organic'], uom: '500g', mrp: [200, 250, 300], category: 'honey_jams' },
        { base: 'Jam', brands: ['Kissan', 'Mapro', 'Smucker\'s'], uom: '200g', mrp: [80, 90, 100], category: 'honey_jams' },
        { base: 'Ketchup', brands: ['Kissan', 'Maggi', 'Heinz'], uom: '500g', mrp: [60, 70, 80], category: 'sauces_ketchup' },
        { base: 'Sauce', brands: ['Kissan', 'Maggi', 'Heinz'], uom: '200g', mrp: [40, 45, 50], category: 'sauces_ketchup' },
        { base: 'Pickle', brands: ['Mother\'s Recipe', 'Priya', 'Kissan'], uom: '500g', mrp: [120, 140, 160], category: 'pickles_chutneys' },
        { base: 'Noodles', brands: ['Maggi', 'Top Ramen', 'Yippee'], uom: 'pack', mrp: [14, 16, 18], category: 'noodles_pasta' },
        { base: 'Pasta', brands: ['Sunfeast', 'Barilla', 'Del Monte'], uom: '200g', mrp: [50, 60, 70], category: 'noodles_pasta' },
        { base: 'Soap', brands: ['Dove', 'Lux', 'Pears'], uom: 'piece', mrp: [40, 45, 50], category: 'bath_body' },
        { base: 'Shampoo', brands: ['Pantene', 'Head & Shoulders', 'L\'Oreal'], uom: '200ml', mrp: [150, 180, 200], category: 'hair_care' },
        { base: 'Toothpaste', brands: ['Colgate', 'Pepsodent', 'Sensodyne'], uom: '100g', mrp: [60, 70, 80], category: 'oral_care' },
        { base: 'Detergent', brands: ['Surf Excel', 'Ariel', 'Tide'], uom: '1kg', mrp: [120, 140, 160], category: 'laundry' },
        { base: 'Floor Cleaner', brands: ['Lizol', 'Harpic', 'Domex'], uom: '500ml', mrp: [80, 90, 100], category: 'cleaning' },
    ];

    let productId = 1;
    productTemplates.forEach(template => {
        template.brands.forEach((brand, brandIdx) => {
            const variations = [
                { size: '', mrp: template.mrp[brandIdx] },
                { size: ' (500g)', mrp: Math.round(template.mrp[brandIdx] * 0.5) },
                { size: ' (1kg)', mrp: template.mrp[brandIdx] },
                { size: ' (2kg)', mrp: Math.round(template.mrp[brandIdx] * 1.8) },
            ];

            variations.forEach((variation, varIdx) => {
                if (products.length >= 150) return; // Limit to 150 products

                const name = `${brand} ${template.base}${variation.size}`;
                const imageUrl = imageUrls.products[productId % imageUrls.products.length];

                products.push({
                    'Product Name': name,
                    'Brand': brand,
                    'UOM': template.uom,
                    'Default MRP': variation.mrp,
                    'Category ID (optional)': template.category,
                    'Image URL': imageUrl
                });

                productId++;
            });
        });
    });

    // Add more products to reach 100+
    const additionalProducts = [
        { name: 'Coconut Oil', brand: 'Parachute', uom: 'liter', mrp: 180, category: 'oil_ghee' },
        { name: 'Olive Oil', brand: 'Borges', uom: '500ml', mrp: 350, category: 'oil_ghee' },
        { name: 'Sesame Oil', brand: 'Fortune', uom: 'liter', mrp: 200, category: 'oil_ghee' },
        { name: 'Almonds', brand: 'California', uom: '100g', mrp: 120, category: 'nuts_dryfruits' },
        { name: 'Cashews', brand: 'Local', uom: '100g', mrp: 150, category: 'nuts_dryfruits' },
        { name: 'Raisins', brand: 'Local', uom: '200g', mrp: 80, category: 'nuts_dryfruits' },
        { name: 'Dates', brand: 'Medjool', uom: '250g', mrp: 200, category: 'nuts_dryfruits' },
        { name: 'Walnuts', brand: 'Kashmiri', uom: '100g', mrp: 180, category: 'nuts_dryfruits' },
        { name: 'Pistachios', brand: 'Iranian', uom: '100g', mrp: 250, category: 'nuts_dryfruits' },
        { name: 'Bread', brand: 'Britannia', uom: 'pack', mrp: 40, category: 'bread_buns' },
        { name: 'Bun', brand: 'Britannia', uom: 'pack', mrp: 35, category: 'bread_buns' },
        { name: 'Pav', brand: 'Local', uom: 'pack', mrp: 30, category: 'bread_buns' },
        { name: 'Rusk', brand: 'Britannia', uom: '200g', mrp: 50, category: 'rusk_khari' },
        { name: 'Khari', brand: 'Local', uom: '200g', mrp: 60, category: 'rusk_khari' },
        { name: 'Cake', brand: 'Britannia', uom: '200g', mrp: 80, category: 'cakes_pastries' },
        { name: 'Pastry', brand: 'Local Bakery', uom: 'piece', mrp: 40, category: 'cakes_pastries' },
        { name: 'Muffin', brand: 'Local Bakery', uom: 'piece', mrp: 35, category: 'cakes_pastries' },
        { name: 'Donut', brand: 'Local Bakery', uom: 'piece', mrp: 30, category: 'cakes_pastries' },
        { name: 'Croissant', brand: 'Local Bakery', uom: 'piece', mrp: 45, category: 'cakes_pastries' },
        { name: 'Chocolate', brand: 'Cadbury', uom: '100g', mrp: 50, category: 'chocolates' },
        { name: 'Dark Chocolate', brand: 'Amul', uom: '100g', mrp: 80, category: 'chocolates' },
        { name: 'White Chocolate', brand: 'Cadbury', uom: '100g', mrp: 60, category: 'chocolates' },
        { name: 'Ice Cream', brand: 'Amul', uom: '500ml', mrp: 120, category: 'ice_cream' },
        { name: 'Ice Cream', brand: 'Kwality Walls', uom: '500ml', mrp: 150, category: 'ice_cream' },
        { name: 'Ice Cream', brand: 'Häagen-Dazs', uom: '500ml', mrp: 400, category: 'ice_cream' },
    ];

    additionalProducts.forEach((prod, idx) => {
        if (products.length >= 150) return;
        products.push({
            'Product Name': prod.name,
            'Brand': prod.brand,
            'UOM': prod.uom,
            'Default MRP': prod.mrp,
            'Category ID (optional)': prod.category,
            'Image URL': imageUrls.products[idx % imageUrls.products.length]
        });
    });

    return products.slice(0, 150); // Return exactly 150 products
}

// Generate Categories Excel
function generateCategoriesExcel() {
    const categories = generateCategories();
    const ws = XLSX.utils.json_to_sheet(categories.map(cat => ({
        'Category Name': cat.name,
        'Category ID': cat.id,
        'Priority': cat.priority,
        'Visible': cat.visible,
        'Icon Name': cat.iconName,
        'Icon URL': cat.iconUrl
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categories');

    const filePath = path.join(outputDir, 'categories_dummy_data.xlsx');
    XLSX.writeFile(wb, filePath);
    console.log(`✅ Generated: ${filePath} (${categories.length} categories)`);
}

// Generate Master Products Excel
function generateMasterProductsExcel() {
    const products = generateMasterProducts();
    const ws = XLSX.utils.json_to_sheet(products);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Master Products');

    const filePath = path.join(outputDir, 'master_products_dummy_data.xlsx');
    XLSX.writeFile(wb, filePath);
    console.log(`✅ Generated: ${filePath} (${products.length} products)`);
}

// Generate Vendor Products Template (with sample data)
function generateVendorProductsExcel() {
    const sampleProducts = generateMasterProducts().slice(0, 50); // Take first 50 for vendor template

    const ws = XLSX.utils.json_to_sheet(sampleProducts.map((prod, idx) => ({
        'Vendor Product ID': `VP${String(idx + 1).padStart(4, '0')}`,
        'Product Name': prod['Product Name'],
        'Current Price': Math.round(prod['Default MRP'] * 0.9), // 10% discount from MRP
        'New Price': '',
        'MRP (optional)': prod['Default MRP'],
        'UOM': prod['UOM'],
        'Category ID': prod['Category ID (optional)'],
        'Image URL': prod['Image URL']
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bulk Price Update');

    const filePath = path.join(outputDir, 'vendor_products_dummy_data.xlsx');
    XLSX.writeFile(wb, filePath);
    console.log(`✅ Generated: ${filePath} (${sampleProducts.length} products)`);
}

// Generate Vendors Excel
function generateVendorsExcel() {
    // Vendor data generation (simplified version)
    const firstNames = ['Raj', 'Priya', 'Amit', 'Sneha', 'Rahul', 'Anjali', 'Vikram', 'Kavita', 'Suresh', 'Meera'];
    const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Yadav', 'Shah', 'Mehta', 'Jain'];
    const shopNames = ['Fresh Mart', 'Quick Store', 'City Groceries', 'Daily Needs', 'Super Market', 'Local Store', 'Family Shop', 'Prime Grocers', 'Best Deals', 'Value Store'];
    const categories = ['Grocery', 'General Store', 'Fruits & Vegetables', 'Dairy Products', 'Bakery', 'Beverages', 'Snacks', 'Spices'];
    const circles = ['North Circle', 'South Circle', 'East Circle', 'West Circle', 'Central Circle'];
    const states = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat'];
    const cities = ['New Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Ahmedabad'];
    const towns = ['Central Delhi', 'Mumbai Suburban', 'Bangalore Urban', 'Chennai Central', 'Ahmedabad City'];
    const tehsils = ['Connaught Place', 'Andheri', 'Koramangala', 'T. Nagar', 'Navrangpura'];
    const subTehsils = ['CP', 'Andheri East', 'HSR Layout', 'Pondy Bazaar', 'CG Road'];

    function generatePhone() {
        const prefixes = ['9876', '9875', '9874', '9873', '9872'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(100000 + Math.random() * 900000);
        return `${prefix}${suffix}`;
    }

    function generateEmail(firstName, lastName) {
        const domains = ['gmail.com', 'yahoo.com', 'hotmail.com'];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const randomNum = Math.floor(Math.random() * 1000);
        return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@${domain}`;
    }

    const vendors = [];
    for (let i = 0; i < 50; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const ownerName = `${firstName} ${lastName}`;
        const shopName = shopNames[Math.floor(Math.random() * shopNames.length)];
        const contactNumber = generatePhone();
        const email = generateEmail(firstName, lastName);
        const state = states[Math.floor(Math.random() * states.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const town = towns[Math.floor(Math.random() * towns.length)];
        const tehsil = tehsils[Math.floor(Math.random() * tehsils.length)];
        const subTehsil = subTehsils[Math.floor(Math.random() * subTehsils.length)];
        const circle = circles[Math.floor(Math.random() * circles.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const status = Math.random() > 0.3 ? 'Active' : 'Pending';
        const kycStatus = Math.random() > 0.3 ? 'Approved' : 'Pending';

        vendors.push({
            'Shop Name': `${shopName} ${i + 1}`,
            'Owner Name': ownerName,
            'Contact Number': contactNumber,
            'Email': email,
            'State': state,
            'City': city,
            'Town': town,
            'Tehsil': tehsil,
            'Sub Tehsil': subTehsil,
            'Circle': circle,
            'Category': category,
            'Status': status,
            'KYC Status': kycStatus,
            'Address': `Shop ${i + 1}, Main Market`,
            'Landmark': `Near Landmark ${i + 1}`,
            'Pincode': `${110000 + i}`,
        });
    }

    const ws = XLSX.utils.json_to_sheet(vendors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendors');

    const filePath = path.join(outputDir, 'vendors_dummy_data.xlsx');
    XLSX.writeFile(wb, filePath);
    console.log(`✅ Generated: ${filePath} (${vendors.length} vendors)`);
}

// Generate Users Excel
function generateUsersExcel() {
    const firstNames = ['Raj', 'Priya', 'Amit', 'Sneha', 'Rahul', 'Anjali', 'Vikram', 'Kavita', 'Suresh', 'Meera'];
    const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Verma', 'Yadav', 'Shah', 'Mehta', 'Jain'];
    const states = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat'];
    const cities = ['New Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Ahmedabad'];

    function generatePhone() {
        const prefixes = ['9876', '9875', '9874', '9873', '9872'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(100000 + Math.random() * 900000);
        return `${prefix}${suffix}`;
    }

    function generateEmail(firstName, lastName) {
        const domains = ['gmail.com', 'yahoo.com', 'hotmail.com'];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const randomNum = Math.floor(Math.random() * 1000);
        return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@${domain}`;
    }

    const users = [];
    for (let i = 0; i < 50; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;
        const phone = generatePhone();
        const email = generateEmail(firstName, lastName);
        const state = states[Math.floor(Math.random() * states.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const status = Math.random() > 0.2 ? 'Active' : 'Blocked';

        users.push({
            'Full Name': fullName,
            'Email': email,
            'Phone': phone,
            'State': state,
            'City': city,
            'Status': status,
        });
    }

    const ws = XLSX.utils.json_to_sheet(users);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');

    const filePath = path.join(outputDir, 'users_dummy_data.xlsx');
    XLSX.writeFile(wb, filePath);
    console.log(`✅ Generated: ${filePath} (${users.length} users)`);
}

// Run all generators
console.log('🚀 Generating dummy Excel files with images...\n');
generateCategoriesExcel();
generateMasterProductsExcel();
generateVendorProductsExcel();
generateVendorsExcel();
generateUsersExcel();
console.log('\n✨ All dummy data files generated successfully!');
console.log(`📁 Files saved in: ${outputDir}`);
