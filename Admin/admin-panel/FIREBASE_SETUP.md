# Firebase Cloud Messaging Setup Guide

This guide will help you set up Firebase Cloud Messaging (FCM) for push notifications in the admin panel.

## Prerequisites

1. A Firebase project (create one at https://console.firebase.google.com/)
2. Node.js and npm installed

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 2: Add Web App to Firebase

1. In Firebase Console, click the web icon (`</>`) to add a web app
2. Register your app with a nickname (e.g., "Local Market Admin")
3. Copy the Firebase configuration object

## Step 3: Get Firebase Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Copy the config values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId` (optional)

## Step 4: Generate VAPID Key

1. In Firebase Console, go to Project Settings
2. Click on "Cloud Messaging" tab
3. Scroll to "Web configuration"
4. Under "Web Push certificates", click "Generate key pair"
5. Copy the generated VAPID key

## Step 5: Configure Environment Variables

Create a `.env.local` file in the root of your admin-panel directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

## Step 6: Update Service Worker

Update the Firebase config in `public/firebase-messaging-sw.js` with your actual values.

## Step 7: Install Firebase Admin SDK (for sending notifications)

```bash
npm install firebase-admin
```

## Step 8: Set up Firebase Admin SDK

1. In Firebase Console, go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Store it securely (never commit to git!)
5. Use it in your API routes to send notifications

## Step 9: Update API Routes

Update the API routes in `app/api/send-notification/route.js` and `app/api/send-notification-topic/route.js` to use Firebase Admin SDK:

```javascript
import admin from 'firebase-admin';
import serviceAccount from '@/path/to/serviceAccountKey.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Then use admin.messaging().send() to send notifications
```

## Step 10: Test Notifications

1. Start your development server: `npm run dev`
2. Open the admin panel in your browser
3. Allow notification permissions when prompted
4. Check the console for the FCM token
5. Use the SendNotification component to test sending notifications

## Features

- ✅ Request notification permission
- ✅ Get FCM token
- ✅ Receive foreground notifications
- ✅ Receive background notifications (via service worker)
- ✅ Send notifications to specific tokens
- ✅ Send notifications to topics
- ✅ Notification badge count
- ✅ Mark notifications as read

## Troubleshooting

### Notifications not working?

1. Check browser console for errors
2. Verify Firebase config is correct
3. Ensure service worker is registered
4. Check notification permissions in browser settings
5. Verify VAPID key is correct

### Service worker not registering?

1. Make sure `firebase-messaging-sw.js` is in the `public` folder
2. Check browser console for service worker errors
3. Clear browser cache and reload

### Can't send notifications?

1. Verify Firebase Admin SDK is properly initialized
2. Check API route logs for errors
3. Ensure service account key has proper permissions

## Security Notes

- Never commit `.env.local` or service account keys to git
- Add them to `.gitignore`
- Use environment variables for all sensitive data
- Keep your VAPID key secure



