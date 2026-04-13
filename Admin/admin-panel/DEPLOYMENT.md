# Admin Panel Deployment Guide

## Option 1: Run Locally (Development)

1. Navigate to admin panel directory:
```bash
cd Admin/admin-panel
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

4. Access at: http://localhost:3000

## Option 2: Build for Production (Local)

1. Build the production version:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

3. Access at: http://localhost:3000

## Option 3: Deploy to Vercel (Recommended - Free)

Vercel is the easiest way to deploy Next.js apps:

1. Install Vercel CLI (if not installed):
```bash
npm install -g vercel
```

2. Navigate to admin panel directory:
```bash
cd Admin/admin-panel
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts:
   - Login to Vercel (or create account)
   - Confirm project settings
   - Deploy

5. Your admin panel will be live at: `https://your-project-name.vercel.app`

## Option 4: Deploy to Other Platforms

### Netlify
1. Build command: `npm run build`
2. Publish directory: `.next`
3. Deploy via Netlify dashboard or CLI

### Railway
1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set start command: `npm start`

### AWS/Google Cloud/Azure
1. Build the app: `npm run build`
2. Use a Node.js hosting service
3. Set start command: `npm start`
4. Configure environment variables if needed

## Environment Variables (if needed)

Create a `.env.local` file in `Admin/admin-panel/`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

## Quick Start (Development)

```bash
cd Admin/admin-panel
npm install
npm run dev
```

Then open http://localhost:3000 in your browser.


