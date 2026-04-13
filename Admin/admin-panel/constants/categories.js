// Top 8 Most Preferred Shortcut Categories for Home Screen
export const TOP_8_CATEGORIES = [
  { id: '1', name: 'Groceries / General Store', iconName: 'ShoppingBag', priority: 1 },
  { id: '2', name: 'Electronics & Mobile Accessories', iconName: 'Smartphone', priority: 2 },
  { id: '3', name: 'Clothing & Fashion', iconName: 'Shirt', priority: 3 },
  { id: '4', name: 'Medicines / Pharmacy', iconName: 'Pill', priority: 4 },
  { id: '5', name: 'Home Appliances / Kitchen Items', iconName: 'Zap', priority: 5 },
  { id: '6', name: 'Home Essentials & Household Items', iconName: 'Home', priority: 6 },
  { id: '7', name: 'Stationery / Books / Kids Items', iconName: 'FileText', priority: 7 },
  { id: '8', name: 'Hardware/Sanitary/Electrical Items', iconName: 'Tool', priority: 8 },
];

// Full Category List (58 categories)
export const ALL_CATEGORIES = [
  // Top 8 Priority Categories
  ...TOP_8_CATEGORIES,
  
  // Strong Retail Categories
  { id: '9', name: 'Fruits & Vegetables', iconName: 'Apple', priority: 9 },
  { id: '10', name: 'Dairy & Milk Products', iconName: 'Droplet', priority: 10 },
  { id: '11', name: 'Sweets & Bakery', iconName: 'Gift', priority: 11 },
  { id: '12', name: 'Meat & Chicken', iconName: 'Drumstick', priority: 12 },
  { id: '13', name: 'Fish & Seafood', iconName: 'Fish', priority: 13 },
  { id: '14', name: 'Cosmetics & Beauty', iconName: 'Sparkles', priority: 14 },
  { id: '15', name: 'Perfume & Deodorant', iconName: 'Wind', priority: 15 },
  { id: '16', name: 'Jewellery & Artificial Jewellery', iconName: 'Gem', priority: 16 },
  { id: '17', name: 'Footwear', iconName: 'Footprints', priority: 17 },
  { id: '18', name: 'Bags & Luggage', iconName: 'Briefcase', priority: 18 },
  { id: '19', name: 'Watches', iconName: 'Clock', priority: 19 },
  { id: '20', name: 'Gift Items', iconName: 'Gift', priority: 20 },
  { id: '21', name: 'Toys & Kids Store', iconName: 'Toy', priority: 21 },
  { id: '22', name: 'Sports Goods', iconName: 'Trophy', priority: 22 },
  { id: '23', name: 'Fitness & Gym Items', iconName: 'Activity', priority: 23 },
  { id: '24', name: 'Musical Instruments', iconName: 'Music', priority: 24 },
  { id: '25', name: 'CCTV & Security Systems', iconName: 'Camera', priority: 25 },
  { id: '26', name: 'Computer & IT Accessories', iconName: 'Monitor', priority: 26 },
  { id: '27', name: 'Gaming Store', iconName: 'Gamepad', priority: 27 },
  { id: '28', name: 'Car Accessories', iconName: 'Car', priority: 28 },
  { id: '29', name: 'Bike Accessories', iconName: 'Bike', priority: 29 },
  { id: '30', name: 'Tyre Shop', iconName: 'Circle', priority: 30 },
  { id: '31', name: 'Paint Shop', iconName: 'Palette', priority: 31 },
  { id: '32', name: 'Tiles & Sanitary Store', iconName: 'Square', priority: 32 },
  { id: '33', name: 'Furniture Store', iconName: 'Layers', priority: 33 },
  { id: '34', name: 'Mattress & Bedding', iconName: 'Bed', priority: 34 },
  { id: '35', name: 'Curtains & Home Decor', iconName: 'Image', priority: 35 },
  { id: '36', name: 'Lighting & Decorative Lights', iconName: 'Sun', priority: 36 },
  { id: '37', name: 'Utensils / Kitchenware', iconName: 'Utensils', priority: 37 },
  { id: '38', name: 'Steel Shop', iconName: 'Box', priority: 38 },
  { id: '39', name: 'Crockery Store', iconName: 'Circle', priority: 39 },
  { id: '40', name: 'Pooja / Religious Store', iconName: 'Star', priority: 40 },
  { id: '41', name: 'Stationery Wholesale', iconName: 'FileText', priority: 41 },
  { id: '42', name: 'Packaging Material', iconName: 'Package', priority: 42 },
  { id: '43', name: 'Plastic Goods Shop', iconName: 'Box', priority: 43 },
  { id: '44', name: 'Pet Shop', iconName: 'Heart', priority: 44 },
  { id: '45', name: 'Aquarium Shop', iconName: 'Droplet', priority: 45 },
  { id: '46', name: 'Seeds & Fertilizer', iconName: 'Leaf', priority: 46 },
  { id: '47', name: 'Agriculture Tools', iconName: 'Tool', priority: 47 },
  { id: '48', name: 'Hardware Wholesale', iconName: 'Tool', priority: 48 },
  { id: '49', name: 'Electrical Wholesale', iconName: 'Zap', priority: 49 },
  { id: '50', name: 'Building Material Supply', iconName: 'Layers', priority: 50 },
  { id: '51', name: 'Water Tank & Pipes', iconName: 'Droplet', priority: 51 },
  { id: '52', name: 'Solar Products', iconName: 'Sun', priority: 52 },
  { id: '53', name: 'Medical Equipment Store', iconName: 'Activity', priority: 53 },
  { id: '54', name: 'Optical Shop', iconName: 'Eye', priority: 54 },
  { id: '55', name: 'Hearing Aid Store', iconName: 'Headphones', priority: 55 },
  { id: '56', name: 'Ayurvedic Store', iconName: 'Leaf', priority: 56 },
  { id: '57', name: 'Home Cleaning Solutions Store', iconName: 'Sparkles', priority: 57 },
  { id: '58', name: 'Seasonal & Festival Items', iconName: 'Gift', priority: 58 },
];

// Get category by ID
export const getCategoryById = (id) => {
  return ALL_CATEGORIES.find(cat => cat.id === id);
};

// Get category by name
export const getCategoryByName = (name) => {
  return ALL_CATEGORIES.find(cat => cat.name === name);
};
