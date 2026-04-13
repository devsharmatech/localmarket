/**
 * Script to create a comprehensive dummy product list Excel file
 * with categories, products, images, icons, and all required data
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Category data with icons and images
const categories = [
  { id: 'cat_001', name: 'Fruits & Vegetables', icon_name: 'Apple', priority: 1, image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400' },
  { id: 'cat_002', name: 'Fresh Fruits', icon_name: 'Apple', priority: 2, image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400' },
  { id: 'cat_003', name: 'Fresh Vegetables', icon_name: 'Carrot', priority: 3, image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { id: 'cat_004', name: 'Dairy & Eggs', icon_name: 'Droplet', priority: 4, image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { id: 'cat_005', name: 'Milk & Milk Products', icon_name: 'Droplet', priority: 5, image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { id: 'cat_006', name: 'Bakery', icon_name: 'Gift', priority: 6, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400' },
  { id: 'cat_007', name: 'Beverages', icon_name: 'Coffee', priority: 7, image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400' },
  { id: 'cat_008', name: 'Tea & Coffee', icon_name: 'Coffee', priority: 8, image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400' },
  { id: 'cat_009', name: 'Snacks & Namkeen', icon_name: 'Package', priority: 9, image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400' },
  { id: 'cat_010', name: 'Spices & Masalas', icon_name: 'Circle', priority: 10, image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400' },
  { id: 'cat_011', name: 'Grains & Pulses', icon_name: 'Box', priority: 11, image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { id: 'cat_012', name: 'Rice & Rice Products', icon_name: 'Box', priority: 12, image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { id: 'cat_013', name: 'Oil & Ghee', icon_name: 'Droplet', priority: 13, image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacb8a73f9?w=400' },
  { id: 'cat_014', name: 'Personal Care', icon_name: 'Sparkles', priority: 14, image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400' },
  { id: 'cat_015', name: 'Home Care', icon_name: 'Home', priority: 15, image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
];

// Comprehensive product data
const products = [
  // Fruits & Vegetables - Fresh Fruits
  { name: 'Apple', brand: 'Himachal', uom: 'kg', default_mrp: 150, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400' },
  { name: 'Apple', brand: 'Kashmiri', uom: 'kg', default_mrp: 180, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400' },
  { name: 'Apple', brand: 'Washington', uom: 'kg', default_mrp: 200, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400' },
  { name: 'Banana', brand: 'Robusta', uom: 'dozen', default_mrp: 50, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400' },
  { name: 'Banana', brand: 'Cavendish', uom: 'dozen', default_mrp: 60, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400' },
  { name: 'Orange', brand: 'Nagpur', uom: 'kg', default_mrp: 100, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=400' },
  { name: 'Orange', brand: 'Kinnow', uom: 'kg', default_mrp: 120, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=400' },
  { name: 'Mango', brand: 'Alphonso', uom: 'kg', default_mrp: 250, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1605027990121-c73661ea8d0a?w=400' },
  { name: 'Mango', brand: 'Kesar', uom: 'kg', default_mrp: 200, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1605027990121-c73661ea8d0a?w=400' },
  { name: 'Grapes', brand: 'Green', uom: 'kg', default_mrp: 120, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1599599810769-5c8e8b0e8b1b?w=400' },
  { name: 'Grapes', brand: 'Black', uom: 'kg', default_mrp: 140, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1599599810769-5c8e8b0b0e8b1b?w=400' },
  { name: 'Pomegranate', brand: 'Kandhari', uom: 'kg', default_mrp: 180, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1605027990121-c73661ea8d0a?w=400' },
  { name: 'Watermelon', brand: 'Local', uom: 'piece', default_mrp: 80, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400' },
  { name: 'Papaya', brand: 'Local', uom: 'kg', default_mrp: 60, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1605027990121-c73661ea8d0a?w=400' },
  { name: 'Guava', brand: 'Local', uom: 'kg', default_mrp: 70, category_id: 'cat_002', image_url: 'https://images.unsplash.com/photo-1605027990121-c73661ea8d0a?w=400' },

  // Fresh Vegetables
  { name: 'Tomato', brand: 'Local', uom: 'kg', default_mrp: 50, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1546099258-11e2574275f0?w=400' },
  { name: 'Tomato', brand: 'Hybrid', uom: 'kg', default_mrp: 60, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1546099258-11e2574275f0?w=400' },
  { name: 'Onion', brand: 'Red', uom: 'kg', default_mrp: 35, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400' },
  { name: 'Onion', brand: 'White', uom: 'kg', default_mrp: 30, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400' },
  { name: 'Potato', brand: 'Local', uom: 'kg', default_mrp: 30, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400' },
  { name: 'Potato', brand: 'Baby', uom: 'kg', default_mrp: 40, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400' },
  { name: 'Carrot', brand: 'Red', uom: 'kg', default_mrp: 50, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { name: 'Carrot', brand: 'Orange', uom: 'kg', default_mrp: 60, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { name: 'Capsicum', brand: 'Green', uom: 'kg', default_mrp: 100, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { name: 'Capsicum', brand: 'Red', uom: 'kg', default_mrp: 120, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { name: 'Capsicum', brand: 'Yellow', uom: 'kg', default_mrp: 130, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { name: 'Cabbage', brand: 'Local', uom: 'kg', default_mrp: 40, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { name: 'Cauliflower', brand: 'Local', uom: 'kg', default_mrp: 45, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { name: 'Brinjal', brand: 'Local', uom: 'kg', default_mrp: 50, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { name: 'Okra', brand: 'Local', uom: 'kg', default_mrp: 60, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { name: 'Spinach', brand: 'Local', uom: 'bunch', default_mrp: 20, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { name: 'Coriander Leaves', brand: 'Local', uom: 'bunch', default_mrp: 15, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },
  { name: 'Mint Leaves', brand: 'Local', uom: 'bunch', default_mrp: 20, category_id: 'cat_003', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400' },

  // Dairy & Eggs - Milk Products
  { name: 'Milk', brand: 'Amul', uom: 'liter', default_mrp: 65, category_id: 'cat_005', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { name: 'Milk', brand: 'Mother Dairy', uom: 'liter', default_mrp: 70, category_id: 'cat_005', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { name: 'Milk', brand: 'Heritage', uom: 'liter', default_mrp: 68, category_id: 'cat_005', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { name: 'Curd', brand: 'Amul', uom: 'kg', default_mrp: 55, category_id: 'cat_005', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { name: 'Curd', brand: 'Mother Dairy', uom: 'kg', default_mrp: 60, category_id: 'cat_005', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { name: 'Paneer', brand: 'Amul', uom: 'kg', default_mrp: 320, category_id: 'cat_005', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { name: 'Paneer', brand: 'Mother Dairy', uom: 'kg', default_mrp: 350, category_id: 'cat_005', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { name: 'Butter', brand: 'Amul', uom: '100g', default_mrp: 55, category_id: 'cat_005', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { name: 'Butter', brand: 'Mother Dairy', uom: '100g', default_mrp: 60, category_id: 'cat_005', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { name: 'Ghee', brand: 'Amul', uom: 'kg', default_mrp: 550, category_id: 'cat_005', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { name: 'Ghee', brand: 'Mother Dairy', uom: 'kg', default_mrp: 600, category_id: 'cat_005', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { name: 'Cheese', brand: 'Amul', uom: '200g', default_mrp: 120, category_id: 'cat_005', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400' },
  { name: 'Eggs', brand: 'Farm Fresh', uom: 'dozen', default_mrp: 80, category_id: 'cat_004', image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400' },
  { name: 'Eggs', brand: 'Country', uom: 'dozen', default_mrp: 75, category_id: 'cat_004', image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400' },

  // Bakery
  { name: 'White Bread', brand: 'Britannia', uom: 'pack', default_mrp: 40, category_id: 'cat_006', image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400' },
  { name: 'Brown Bread', brand: 'Britannia', uom: 'pack', default_mrp: 45, category_id: 'cat_006', image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400' },
  { name: 'Bun', brand: 'Local', uom: 'piece', default_mrp: 5, category_id: 'cat_006', image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400' },
  { name: 'Cake', brand: 'Local', uom: 'kg', default_mrp: 300, category_id: 'cat_006', image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400' },
  { name: 'Cookies', brand: 'Britannia', uom: 'pack', default_mrp: 35, category_id: 'cat_006', image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400' },
  { name: 'Biscuits', brand: 'Parle-G', uom: 'pack', default_mrp: 10, category_id: 'cat_006', image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400' },
  { name: 'Rusk', brand: 'Britannia', uom: 'pack', default_mrp: 50, category_id: 'cat_006', image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400' },

  // Tea & Coffee
  { name: 'Tea', brand: 'Tata Tea', uom: '250g', default_mrp: 90, category_id: 'cat_008', image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400' },
  { name: 'Tea', brand: 'Red Label', uom: '250g', default_mrp: 100, category_id: 'cat_008', image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400' },
  { name: 'Tea', brand: 'Taj Mahal', uom: '250g', default_mrp: 110, category_id: 'cat_008', image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400' },
  { name: 'Green Tea', brand: 'Tata', uom: '100g', default_mrp: 180, category_id: 'cat_008', image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400' },
  { name: 'Coffee', brand: 'Nescafe', uom: '100g', default_mrp: 250, category_id: 'cat_008', image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400' },
  { name: 'Coffee', brand: 'Bru', uom: '100g', default_mrp: 200, category_id: 'cat_008', image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400' },
  { name: 'Coffee', brand: 'Davidoff', uom: '100g', default_mrp: 300, category_id: 'cat_008', image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400' },

  // Snacks & Namkeen
  { name: 'Namkeen', brand: 'Haldiram', uom: '200g', default_mrp: 60, category_id: 'cat_009', image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400' },
  { name: 'Chips', brand: 'Lays', uom: 'pack', default_mrp: 20, category_id: 'cat_009', image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400' },
  { name: 'Kurkure', brand: 'Kurkure', uom: 'pack', default_mrp: 20, category_id: 'cat_009', image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400' },
  { name: 'Almonds', brand: 'California', uom: '100g', default_mrp: 120, category_id: 'cat_009', image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400' },
  { name: 'Cashews', brand: 'Premium', uom: '100g', default_mrp: 150, category_id: 'cat_009', image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400' },
  { name: 'Raisins', brand: 'Premium', uom: '100g', default_mrp: 80, category_id: 'cat_009', image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400' },

  // Spices & Masalas
  { name: 'Turmeric Powder', brand: 'Everest', uom: '100g', default_mrp: 35, category_id: 'cat_010', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400' },
  { name: 'Turmeric Powder', brand: 'MDH', uom: '100g', default_mrp: 40, category_id: 'cat_010', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400' },
  { name: 'Red Chilli Powder', brand: 'Everest', uom: '100g', default_mrp: 45, category_id: 'cat_010', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400' },
  { name: 'Coriander Powder', brand: 'Everest', uom: '100g', default_mrp: 40, category_id: 'cat_010', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400' },
  { name: 'Garam Masala', brand: 'Everest', uom: '100g', default_mrp: 55, category_id: 'cat_010', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400' },
  { name: 'Cumin Seeds', brand: 'Everest', uom: '100g', default_mrp: 70, category_id: 'cat_010', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400' },
  { name: 'Mustard Seeds', brand: 'Everest', uom: '100g', default_mrp: 60, category_id: 'cat_010', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400' },

  // Grains & Pulses - Rice
  { name: 'Basmati Rice', brand: 'India Gate', uom: 'kg', default_mrp: 150, category_id: 'cat_012', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { name: 'Basmati Rice', brand: 'Kohinoor', uom: 'kg', default_mrp: 200, category_id: 'cat_012', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { name: 'Sona Masoori Rice', brand: 'India Gate', uom: 'kg', default_mrp: 70, category_id: 'cat_012', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { name: 'Wheat Atta', brand: 'Aashirvaad', uom: 'kg', default_mrp: 55, category_id: 'cat_011', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { name: 'Wheat Atta', brand: 'Pillsbury', uom: 'kg', default_mrp: 60, category_id: 'cat_011', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { name: 'Toor Dal', brand: 'Tata', uom: 'kg', default_mrp: 130, category_id: 'cat_011', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { name: 'Moong Dal', brand: 'Tata', uom: 'kg', default_mrp: 110, category_id: 'cat_011', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { name: 'Chana Dal', brand: 'Tata', uom: 'kg', default_mrp: 120, category_id: 'cat_011', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { name: 'Urad Dal', brand: 'Tata', uom: 'kg', default_mrp: 140, category_id: 'cat_011', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },

  // Oil & Ghee
  { name: 'Sunflower Oil', brand: 'Fortune', uom: 'liter', default_mrp: 130, category_id: 'cat_013', image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacb8a73f9?w=400' },
  { name: 'Sunflower Oil', brand: 'Saffola', uom: 'liter', default_mrp: 140, category_id: 'cat_013', image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacb8a73f9?w=400' },
  { name: 'Mustard Oil', brand: 'Fortune', uom: 'liter', default_mrp: 150, category_id: 'cat_013', image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacb8a73f9?w=400' },
  { name: 'Groundnut Oil', brand: 'Fortune', uom: 'liter', default_mrp: 160, category_id: 'cat_013', image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacb8a73f9?w=400' },
  { name: 'Coconut Oil', brand: 'Parachute', uom: 'liter', default_mrp: 180, category_id: 'cat_013', image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacb8a73f9?w=400' },

  // Personal Care
  { name: 'Shampoo', brand: 'Pantene', uom: 'bottle', default_mrp: 200, category_id: 'cat_014', image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400' },
  { name: 'Shampoo', brand: 'Head & Shoulders', uom: 'bottle', default_mrp: 220, category_id: 'cat_014', image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400' },
  { name: 'Soap', brand: 'Dove', uom: 'piece', default_mrp: 45, category_id: 'cat_014', image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400' },
  { name: 'Soap', brand: 'Lux', uom: 'piece', default_mrp: 30, category_id: 'cat_014', image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400' },
  { name: 'Toothpaste', brand: 'Colgate', uom: 'tube', default_mrp: 80, category_id: 'cat_014', image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400' },
  { name: 'Toothpaste', brand: 'Pepsodent', uom: 'tube', default_mrp: 75, category_id: 'cat_014', image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400' },

  // Home Care
  { name: 'Detergent', brand: 'Surf Excel', uom: 'kg', default_mrp: 200, category_id: 'cat_015', image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
  { name: 'Detergent', brand: 'Ariel', uom: 'kg', default_mrp: 220, category_id: 'cat_015', image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
  { name: 'Dishwash', brand: 'Vim', uom: 'bottle', default_mrp: 80, category_id: 'cat_015', image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
  { name: 'Floor Cleaner', brand: 'Lizol', uom: 'bottle', default_mrp: 120, category_id: 'cat_015', image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
  { name: 'Toilet Cleaner', brand: 'Harpic', uom: 'bottle', default_mrp: 100, category_id: 'cat_015', image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
  { name: 'Air Freshener', brand: 'Odonil', uom: 'bottle', default_mrp: 60, category_id: 'cat_015', image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
  
  // Additional products for more variety
  { name: 'Sugar', brand: 'Madhur', uom: 'kg', default_mrp: 50, category_id: 'cat_011', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { name: 'Salt', brand: 'Tata', uom: 'kg', default_mrp: 25, category_id: 'cat_011', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { name: 'Jaggery', brand: 'Organic', uom: 'kg', default_mrp: 80, category_id: 'cat_011', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { name: 'Honey', brand: 'Dabur', uom: '500g', default_mrp: 200, category_id: 'cat_011', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' },
  { name: 'Pickle', brand: 'Mother\'s Recipe', uom: 'bottle', default_mrp: 150, category_id: 'cat_010', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400' },
  { name: 'Sauce', brand: 'Kissan', uom: 'bottle', default_mrp: 80, category_id: 'cat_010', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400' },
  { name: 'Ketchup', brand: 'Kissan', uom: 'bottle', default_mrp: 90, category_id: 'cat_010', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400' },
  { name: 'Maggi', brand: 'Nestle', uom: 'pack', default_mrp: 14, category_id: 'cat_009', image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400' },
  { name: 'Yippee Noodles', brand: 'Sunfeast', uom: 'pack', default_mrp: 15, category_id: 'cat_009', image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400' },
  { name: 'Cornflakes', brand: 'Kellogg\'s', uom: 'pack', default_mrp: 200, category_id: 'cat_009', image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400' },
  { name: 'Oats', brand: 'Quaker', uom: 'pack', default_mrp: 150, category_id: 'cat_009', image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400' },
];

// Create Excel workbook
const workbook = XLSX.utils.book_new();

// Create Categories sheet
const categoriesSheet = XLSX.utils.json_to_sheet(categories);
XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories');

// Create Products sheet
const productsSheet = XLSX.utils.json_to_sheet(products);
XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'public', 'dummy-data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write Excel file
const outputPath = path.join(outputDir, 'dummy-products-list.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Excel file created successfully!`);
console.log(`📁 Location: ${outputPath}`);
console.log(`📊 Categories: ${categories.length}`);
console.log(`📦 Products: ${products.length}`);
