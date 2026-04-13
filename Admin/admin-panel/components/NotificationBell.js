'use client';

import { useState, useRef, useEffect } from 'react';
import { requestNotificationPermission, onMessageListener } from '../lib/firebase';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState(null);
  const dropdownRef = useRef(null);

  // Load read status from localStorage
  const getReadStatus = () => {
    try {
      const stored = localStorage.getItem('notificationReadStatus');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  // Save read status to localStorage
  const saveReadStatus = (readStatus) => {
    try {
      localStorage.setItem('notificationReadStatus', JSON.stringify(readStatus));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Format time helper function
  const formatTime = (date) => {
    const now = Date.now();
    const timestamp = date instanceof Date ? date.getTime() : new Date(date).getTime();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Load notifications from database
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/notifications?limit=50', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const notifications = Array.isArray(data?.notifications) ? data.notifications : [];

          // Get read status from localStorage
          const readStatus = getReadStatus();

          // Map database notifications to component format
          const mappedNotifications = notifications.map((notif) => {
            const timestamp = notif.sent_at || notif.created_at;
            return {
              id: notif.id,
              title: notif.title || 'Notification',
              message: notif.message || '',
              time: formatTime(new Date(timestamp)),
              type: notif.type || 'info',
              read: readStatus[notif.id] || false,
              timestamp: new Date(timestamp).getTime(),
              dbId: notif.id,
            };
          });

          setNotifs(mappedNotifications);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Request notification permission and get FCM token on mount
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const token = await requestNotificationPermission();
        if (token) {
          setFcmToken(token);
          console.log('FCM Token:', token);
          // Store token in localStorage or send to your backend
          localStorage.setItem('fcmToken', token);
        } else {
          // VAPID key not configured or permission denied - app will work without push notifications
          console.log('Push notifications not available. App will continue to work normally.');
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
        // Don't crash the app if notifications fail
      }
    };

    initializeNotifications();
  }, []);

  // Listen for foreground messages
  useEffect(() => {
    const setupMessageListener = async () => {
      try {
        const payload = await onMessageListener();
        if (payload) {
          handleNewNotification(payload);
        }
      } catch (error) {
        console.error('Error setting up message listener:', error);
      }
    };

    // Set up interval to check for new messages
    const interval = setInterval(setupMessageListener, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle new notification from Firebase
  const handleNewNotification = (payload) => {
    const newNotification = {
      id: Date.now(),
      title: payload.notification?.title || 'New Notification',
      message: payload.notification?.body || payload.data?.message || 'You have a new notification',
      time: 'Just now',
      type: payload.data?.type || 'info',
      read: false,
      timestamp: Date.now(),
    };

    setNotifs((prev) => [newNotification, ...prev]);

    // Reload notifications from database to get the latest
    setTimeout(() => {
      const loadNotifications = async () => {
        try {
          const res = await fetch('/api/notifications?limit=50', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            const notifications = Array.isArray(data?.notifications) ? data.notifications : [];
            const readStatus = getReadStatus();
            const mappedNotifications = notifications.map((notif) => {
              const timestamp = notif.sent_at || notif.created_at;
              return {
                id: notif.id,
                title: notif.title || 'Notification',
                message: notif.message || '',
                time: formatTime(new Date(timestamp)),
                type: notif.type || 'info',
                read: readStatus[notif.id] || false,
                timestamp: new Date(timestamp).getTime(),
                dbId: notif.id,
              };
            });
            setNotifs(mappedNotifications);
          }
        } catch (error) {
          console.error('Error reloading notifications:', error);
        }
      };
      loadNotifications();
    }, 1000);

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: newNotification.id.toString(),
      });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const unreadCount = notifs.filter(n => !n.read).length;

  const handleMarkAsRead = (id) => {
    const updatedNotifs = notifs.map(n => {
      if (n.id === id || n.dbId === id) {
        return { ...n, read: true };
      }
      return n;
    });
    setNotifs(updatedNotifs);

    // Save read status to localStorage
    const readStatus = getReadStatus();
    const notifId = notifs.find(n => n.id === id || n.dbId === id)?.dbId || id;
    readStatus[notifId] = true;
    saveReadStatus(readStatus);
  };

  const handleMarkAllAsRead = () => {
    const updatedNotifs = notifs.map(n => ({ ...n, read: true }));
    setNotifs(updatedNotifs);

    // Save all as read to localStorage
    const readStatus = getReadStatus();
    notifs.forEach(n => {
      if (n.dbId) {
        readStatus[n.dbId] = true;
      }
    });
    saveReadStatus(readStatus);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-white/20 rounded-lg transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 text-xs font-bold text-white rounded-full flex items-center justify-center"
            style={{ background: '#DC2626' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-orange-600 hover:text-orange-800 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <p>Loading notifications...</p>
              </div>
            ) : notifs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifs.map((notification) => (
                  <div
                    key={notification.dbId || notification.id}
                    onClick={() => handleMarkAsRead(notification.dbId || notification.id)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition ${!notification.read ? 'bg-blue-50/50' : ''
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-orange-600 flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {notification.time || formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 text-center">
            <button className="text-sm text-orange-600 hover:text-orange-800 font-medium">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
