# Dummy Data Excel Files for Testing

This folder contains dummy Excel files with 100+ items and image URLs for testing import functionality in the admin panel.

## Generated Files

### 1. `categories_dummy_data.xlsx`
- **115 Categories** with complete data
- **Columns:**
  - Category Name (required)
  - Category ID (auto-generated if not provided)
  - Priority (1-115)
  - Visible (true/false)
  - Icon Name
  - Icon URL (Unsplash image URLs)

**Usage:** Import via Category Management → Import Categories

### 2. `master_products_dummy_data.xlsx`
- **150 Products** with complete data
- **Columns:**
  - Product Name (required)
  - Brand
  - UOM (Unit of Measurement)
  - Default MRP (price)
  - Category ID (optional)
  - Image URL (Unsplash image URLs)

**Usage:** Import via Product Import → Upload Excel file

### 3. `vendor_products_dummy_data.xlsx`
- **50 Sample Products** for bulk price updates
- **Columns:**
  - Vendor Product ID
  - Product Name
  - Current Price
  - New Price (empty - fill to update)
  - MRP (optional)
  - UOM
  - Category ID
  - Image URL

**Usage:** Import via Vendor Products → Bulk Price Update → Download Template

## Image URLs

All files include image URLs using Unsplash placeholder images. These are real image URLs that will work when imported.

## How to Use

1. **Categories:**
   - Go to Category Management
   - Click "Import Categories"
   - Upload `categories_dummy_data.xlsx`
   - Click "Import Categories"

2. **Master Products:**
   - Go to Product Import
   - Upload `master_products_dummy_data.xlsx`
   - Select category (optional)
   - Click "Import Products"

3. **Vendor Products:**
   - Go to Vendor Products
   - Select a vendor
   - Download template or use `vendor_products_dummy_data.xlsx`
   - Fill in "New Price" column
   - Upload to update prices

## Notes

- All image URLs are from Unsplash (free stock photos)
- Prices are in INR (Indian Rupees)
- Categories follow Indian market structure
- Products include common Indian grocery items
- All data is realistic and ready for testing

## Regenerating Files

To regenerate these files with updated data:

```bash
cd Admin/admin-panel
node scripts/generate-dummy-data.js
```

Files will be saved to `public/dummy-data/`
