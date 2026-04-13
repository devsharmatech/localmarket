# Supabase Environment Variables (Admin Panel)

Create a local file **`.env.local`** inside `Admin/admin-panel/` with:

```bash
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
```

Optional (not recommended for admin routes, but supported):

```bash
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

## Security notes

- Never commit keys to git.
- Never use the **service role key** in client components or any `NEXT_PUBLIC_*` variable.
- All admin data access should go through Next.js route handlers (example: `app/api/vendors/route.js`).

