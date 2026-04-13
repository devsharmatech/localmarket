// Server-side Firebase Admin SDK for sending notifications
// This would typically be used in an API route or server-side function

// Note: For Next.js, you would need to install firebase-admin
// npm install firebase-admin

// Example API route to send notifications
// This file shows the structure - actual implementation would be in an API route

export const sendNotification = async (token, notification) => {
  // This should be called from an API route (e.g., /api/send-notification)
  // For now, we'll create a client-side function that calls the API
  
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        notification: {
          title: notification.title,
          body: notification.message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
        data: {
          type: notification.type,
          id: notification.id?.toString(),
        },
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const sendNotificationToTopic = async (topic, notification) => {
  try {
    const response = await fetch('/api/send-notification-topic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        notification: {
          title: notification.title,
          body: notification.message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
        data: {
          type: notification.type,
          id: notification.id?.toString(),
        },
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Error sending notification to topic:', error);
    throw error;
  }
};



