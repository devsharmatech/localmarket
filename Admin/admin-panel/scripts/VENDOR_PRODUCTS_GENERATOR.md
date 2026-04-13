# Vendor Products Dummy Data Generator

This script generates dummy vendor products and assigns them to vendors in the database.

## Features

- Automatically assigns products to vendors based on their category
- Generates realistic pricing (5-15% discount from MRP)
- Creates 5-20 products per vendor
- Matches products to vendor categories when possible
- Inserts products in batches for better performance

## Usage

### Method 1: Using the API Endpoint (Recommended)

Make a POST request to `/api/vendor-products/generate-dummy`:

```bash
curl -X POST http://localhost:3000/api/vendor-products/generate-dummy \
  -H "Content-Type: application/json" \
  -d '{"clearExisting": false}'
```

**Parameters:**
- `clearExisting` (optional, boolean): If `true`, clears existing vendor products before generating new ones. Default: `false`

**Response:**
```json
{
  "success": true,
  "inserted": 450,
  "errors": 0,
  "totalGenerated": 450,
  "vendorsProcessed": 30,
  "averageProductsPerVendor": 15
}
```

### Method 2: Using the Node.js Script

Run the script directly from the command line:

```bash
cd Admin/admin-panel
node scripts/generate-vendor-products.js
```

**Prerequisites:**
- Make sure you have `.env.local` file with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Ensure you have active vendors and categories in the database

## Product Templates

The script includes 40+ product templates covering:
- Fruits & Vegetables (Apple, Banana, Tomato, Onion, etc.)
- Dairy Products (Milk, Curd, Paneer, Butter, Ghee)
- Grains & Pulses (Rice, Wheat, Dal)
- Spices (Turmeric, Chilli Powder, Garam Masala)
- Oil & Ghee (Sunflower Oil, Mustard Oil)
- Tea & Coffee
- Snacks & Bakery Items
- Personal Care & Cleaning Products

## How It Works

1. **Fetches Active Vendors**: Gets all vendors with status "Active"
2. **Fetches Categories**: Gets all categories from the database
3. **Matches Products to Vendors**: 
   - Tries to match products based on vendor category
   - If no match found, assigns random products
   - Each vendor gets 5-20 products
4. **Generates Pricing**:
   - MRP: Base MRP ± 10% variation
   - Price: MRP with 5-15% discount
5. **Inserts in Batches**: Inserts products in batches of 50 for better performance

## Example Output

```
🚀 Starting vendor products generation...

📦 Fetching vendors...
✅ Found 30 active vendors

📂 Fetching categories...
✅ Found 50 categories

🛍️  Generating vendor products...
   Generated products for 10/30 vendors...
   Generated products for 20/30 vendors...
   Generated products for 30/30 vendors...

✅ Generated 450 vendor products

💾 Inserting vendor products into database...

   Inserted batch 1: 50 products (Total: 50)
   Inserted batch 2: 50 products (Total: 100)
   ...
   Inserted batch 9: 50 products (Total: 450)

✨ Vendor products generation complete!
   ✅ Successfully inserted: 450 products
   ❌ Failed to insert: 0 products

📊 Summary:
   - Vendors: 30
   - Products per vendor: ~15
   - Total products: 450
```

## Notes

- Products are assigned based on vendor category matching
- If a vendor category doesn't match any product templates, random products are assigned
- 90% of products are set as active (is_active = true)
- Prices are rounded to 2 decimal places
- The script handles errors gracefully and continues processing

## Troubleshooting

**Error: "No active vendors found"**
- Make sure you have vendors with status "Active" in the database
- Check vendor import/creation

**Error: "No categories found"**
- Make sure categories are imported/created in the database
- Check category import/creation

**Error: "Missing SUPABASE_URL"**
- Ensure `.env.local` file exists with proper environment variables
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

## Related Files

- `scripts/generate-vendor-products.js` - Node.js script
- `app/api/vendor-products/generate-dummy/route.js` - API endpoint
- `sql/ensure_vendor_products_table.sql` - Database schema
