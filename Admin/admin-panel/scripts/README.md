# Scripts for Admin Panel

## Generate Users and Vendors Dummy Data

This script generates and inserts dummy users and vendors into your Supabase database.

### Prerequisites

1. Make sure you have `.env.local` file in the admin-panel directory with:
   ```
   SUPABASE_URL="your-supabase-url"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. Ensure Node.js version 18+ is installed (for native fetch support)

### Usage

Run the script from the admin-panel directory:

```bash
node scripts/generate-users-vendors.js
```

### What it generates

- **50 Users** with:
  - Full name (Indian names)
  - Email address
  - Phone number
  - State and City (from Indian locations)
  - Status (Active/Pending/Blocked)
  - Created date (within last year)
  - Last active date (for active users, within last 30 days)

- **30 Vendors** with:
  - Shop name
  - Owner name
  - Contact number and email
  - Complete address (state, city, town, tehsil, sub-tehsil, circle)
  - Category
  - Status (Active/Pending/Blocked)
  - KYC Status (Approved/Pending/Rejected)
  - Product count (based on status)
  - Rating and review count (for active vendors with products)
  - GST and PAN numbers (for approved vendors)
  - Opening/closing times
  - Weekly off day
  - Created date and last active date

### Notes

- The script inserts data in batches of 10 to avoid overwhelming the API
- If duplicate entries are found, the script will continue with a warning
- All data uses realistic Indian names, locations, and phone numbers
- Vendors with Active status and Approved KYC will have products, ratings, and reviews
