# Quick Fix: Registration Error - Missing Password Column

## Error Message
```
Supabase REST error (400): Could not find the 'password' column of 'users' in the schema cache
```

## Solution

You need to run the SQL script to add the `password`, `otp`, and `otp_expires_at` columns to the `users` table.

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the SQL Script**
   - Copy the entire contents of `sql/add_password_to_users.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

4. **Verify**
   - The script will show a verification query at the end
   - You should see 3 rows returned: `password`, `otp`, `otp_expires_at`

### Alternative: Run via Command Line

If you have `psql` installed and configured:

```bash
psql "your-supabase-connection-string" -f Admin/admin-panel/sql/add_password_to_users.sql
```

### What the Script Does:

1. Adds `password` column (TEXT) - for email login
2. Adds `otp` column (TEXT) - for SMS OTP storage
3. Adds `otp_expires_at` column (TIMESTAMPTZ) - for OTP expiration

All columns are added safely with `IF NOT EXISTS` checks, so it's safe to run multiple times.

### After Running:

1. Try registering again from the mobile app
2. The registration should work now
3. You can also test login with email/password

## Troubleshooting

If you still see errors:
1. Check that the script ran successfully (no errors in Supabase SQL Editor)
2. Refresh the Supabase schema cache (may take a few seconds)
3. Try registering again
