# Deploy Admin Panel to Vercel

## Quick Deploy Steps

### Step 1: Login to Vercel
```bash
cd Admin/admin-panel
vercel login
```
This will open a browser window for you to login with your GitHub, GitLab, or Bitbucket account.

### Step 2: Deploy
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No (for first time)
- **What's your project's name?** → admin-panel (or press Enter for default)
- **In which directory is your code located?** → ./ (press Enter)
- **Want to override the settings?** → No (press Enter)

### Step 3: Production Deploy
After the first deployment, deploy to production:
```bash
vercel --prod
```

## Alternative: Deploy via GitHub

1. Push your code to GitHub (if not already done)
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Select the `Admin/admin-panel` folder
6. Click "Deploy"

## Environment Variables

If you need Firebase or other environment variables:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add your variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

## Your Live URL

After deployment, you'll get a URL like:
- `https://admin-panel-xxxxx.vercel.app`
- Production: `https://admin-panel.vercel.app` (if you set a custom domain)

## Automatic Deployments

Once connected to GitHub, every push to your main branch will automatically deploy!


