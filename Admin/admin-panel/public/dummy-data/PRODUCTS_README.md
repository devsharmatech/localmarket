# Dummy Products List Excel File

## File: `dummy-products-list.xlsx`

This Excel file contains comprehensive dummy data for testing and populating the LocalMarket database.

## File Structure

The Excel file contains **2 sheets**:

### 1. Categories Sheet
Contains **15 categories** with the following columns:
- **id**: Category ID (e.g., `cat_001`, `cat_002`)
- **name**: Category name (e.g., "Fruits & Vegetables", "Dairy & Eggs")
- **icon_name**: Icon name for the category (e.g., "Apple", "Droplet", "Coffee")
- **priority**: Display priority (1-15)
- **image_url**: Category image URL (Unsplash images)

### 2. Products Sheet
Contains **111 products** with the following columns:
- **name**: Product name (e.g., "Apple", "Milk", "Rice")
- **brand**: Product brand (e.g., "Himachal", "Amul", "India Gate")
- **uom**: Unit of Measure (e.g., "kg", "liter", "dozen", "piece", "bottle", "pack", "100g", "200g", "500g")
- **default_mrp**: Maximum Retail Price in ₹ (e.g., 150, 65, 200)
- **category_id**: Reference to category ID from Categories sheet (e.g., `cat_002`, `cat_005`)
- **image_url**: Product image URL (Unsplash images)

## Product Categories Included

1. **Fruits & Vegetables** (15 products)
   - Fresh Fruits: Apple, Banana, Orange, Mango, Grapes, Pomegranate, Watermelon, Papaya, Guava
   - Fresh Vegetables: Tomato, Onion, Potato, Carrot, Capsicum, Cabbage, Cauliflower, Brinjal, Okra, Spinach, Coriander, Mint

2. **Dairy & Eggs** (14 products)
   - Milk Products: Milk, Curd, Paneer, Butter, Ghee, Cheese
   - Eggs: Farm Fresh, Country

3. **Bakery** (7 products)
   - Bread, Bun, Cake, Cookies, Biscuits, Rusk

4. **Tea & Coffee** (7 products)
   - Tea varieties, Green Tea, Coffee brands

5. **Snacks & Namkeen** (9 products)
   - Namkeen, Chips, Kurkure, Nuts, Dry Fruits, Noodles, Cornflakes, Oats

6. **Spices & Masalas** (7 products)
   - Turmeric, Red Chilli, Coriander, Garam Masala, Cumin, Mustard Seeds

7. **Grains & Pulses** (9 products)
   - Rice varieties, Wheat Atta, Dals (Toor, Moong, Chana, Urad), Sugar, Salt, Jaggery, Honey

8. **Oil & Ghee** (5 products)
   - Sunflower Oil, Mustard Oil, Groundnut Oil, Coconut Oil

9. **Personal Care** (6 products)
   - Shampoo, Soap, Toothpaste

10. **Home Care** (5 products)
    - Detergent, Dishwash, Floor Cleaner, Toilet Cleaner, Air Freshener

## Usage

### Import Categories
1. Open the Excel file
2. Go to the "Categories" sheet
3. Use the admin panel import feature to upload categories

### Import Products
1. Open the Excel file
2. Go to the "Products" sheet
3. Use the admin panel import feature to upload products

## Notes

- All image URLs point to Unsplash (free stock images)
- Category IDs are prefixed with `cat_` for easy identification
- Product prices are in Indian Rupees (₹)
- UOM (Unit of Measure) follows standard Indian market conventions
- Brands are popular Indian brands for authenticity

## File Location

```
Admin/admin-panel/public/dummy-data/dummy-products-list.xlsx
```

## Generated On

Generated automatically using the script: `scripts/create-dummy-products-excel.js`
