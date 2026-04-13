'use client';

import { useState, useEffect } from 'react';

export default function AutoNotificationSettings() {
  const [settings, setSettings] = useState({
    priceUpdate: {
      enabled: true,
      frequency: 'weekly', // daily, weekly, monthly
      dayOfWeek: 'monday', // for weekly
      dayOfMonth: 1, // for monthly
      time: '09:00',
      message: 'Please update your product prices to keep them current.'
    },
    idleVendors: {
      enabled: true,
      daysInactive: 30,
      message: 'You haven\'t been active for a while. Please update your listings!'
    },
    idleUsers: {
      enabled: true,
      daysInactive: 60,
      message: 'We miss you! Check out our latest products and offers.'
    }
  });

  const [lastRun, setLastRun] = useState({
    priceUpdate: '2024-12-20 09:00:00',
    idleVendors: '2024-12-20 10:00:00',
    idleUsers: '2024-12-20 10:30:00'
  });

  const handleSettingChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      // Persist each key into Supabase
      await fetch('/api/auto-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'regular_price_update', enabled: settings.priceUpdate.enabled, config: settings.priceUpdate }),
      });
      await fetch('/api/auto-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'idle_vendor', enabled: settings.idleVendors.enabled, config: settings.idleVendors }),
      });
      await fetch('/api/auto-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'idle_user', enabled: settings.idleUsers.enabled, config: settings.idleUsers }),
      });
      alert('Settings saved successfully!');
    } catch (e) {
      alert(e?.message || 'Failed to save settings');
    }
  };

  const handleTestNotification = async (type) => {
    try {
      // Send test notification
      const response = await fetch('/api/send-notification-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: type === 'priceUpdate' ? 'vendors' : type === 'idleVendors' ? 'vendors' : 'users',
          notification: {
            title: `Test: ${type === 'priceUpdate' ? 'Price Update Reminder' : type === 'idleVendors' ? 'Idle Vendor Alert' : 'Idle User Alert'}`,
            body: settings[type].message,
          },
          data: {
            type: 'auto_notification',
            category: type
          },
        }),
      });

      if (response.ok) {
        alert('Test notification sent successfully!');
      } else {
        alert('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Error sending test notification');
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/auto-notifications', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Failed to load settings');
        const rows = Array.isArray(data?.settings) ? data.settings : [];
        const map = new Map(rows.map(r => [r.key, r]));
        if (!cancelled) {
          const p = map.get('regular_price_update');
          const v = map.get('idle_vendor');
          const u = map.get('idle_user');
          setSettings(prev => ({
            priceUpdate: { ...prev.priceUpdate, ...(p?.config || {}), enabled: p ? !!p.enabled : prev.priceUpdate.enabled },
            idleVendors: { ...prev.idleVendors, ...(v?.config || {}), enabled: v ? !!v.enabled : prev.idleVendors.enabled },
            idleUsers: { ...prev.idleUsers, ...(u?.config || {}), enabled: u ? !!u.enabled : prev.idleUsers.enabled },
          }));
        }
      } catch {
        // Keep defaults if not available yet
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Auto Notification Settings</h2>
        <p className="text-gray-600">Configure automatic notifications for price updates and idle users/vendors</p>
      </div>

      {/* Price Update Notifications */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Regular Price Update Notifications</h3>
            <p className="text-sm text-gray-600">Automatically remind vendors to update their prices</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.priceUpdate.enabled}
              onChange={(e) => handleSettingChange('priceUpdate', 'enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>

        {settings.priceUpdate.enabled && (
          <div className="space-y-4 mt-4 pl-4 border-l-4 border-orange-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select
                  value={settings.priceUpdate.frequency}
                  onChange={(e) => handleSettingChange('priceUpdate', 'frequency', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {settings.priceUpdate.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                  <select
                    value={settings.priceUpdate.dayOfWeek}
                    onChange={(e) => handleSettingChange('priceUpdate', 'dayOfWeek', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
              )}

              {settings.priceUpdate.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={settings.priceUpdate.dayOfMonth}
                    onChange={(e) => handleSettingChange('priceUpdate', 'dayOfMonth', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={settings.priceUpdate.time}
                  onChange={(e) => handleSettingChange('priceUpdate', 'time', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notification Message</label>
              <textarea
                value={settings.priceUpdate.message}
                onChange={(e) => handleSettingChange('priceUpdate', 'message', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Last Run</p>
                <p className="text-xs text-gray-500">{lastRun.priceUpdate}</p>
              </div>
              <button
                onClick={() => handleTestNotification('priceUpdate')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Send Test
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Idle Vendors Notifications */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Idle Vendors Notification</h3>
            <p className="text-sm text-gray-600">Notify vendors who haven't been active</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.idleVendors.enabled}
              onChange={(e) => handleSettingChange('idleVendors', 'enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>

        {settings.idleVendors.enabled && (
          <div className="space-y-4 mt-4 pl-4 border-l-4 border-orange-500">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days Inactive Threshold
              </label>
              <input
                type="number"
                min="1"
                value={settings.idleVendors.daysInactive}
                onChange={(e) => handleSettingChange('idleVendors', 'daysInactive', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Vendors inactive for this many days will be notified</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notification Message</label>
              <textarea
                value={settings.idleVendors.message}
                onChange={(e) => handleSettingChange('idleVendors', 'message', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Last Run</p>
                <p className="text-xs text-gray-500">{lastRun.idleVendors}</p>
              </div>
              <button
                onClick={() => handleTestNotification('idleVendors')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Send Test
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Idle Users Notifications */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Idle Users Notification</h3>
            <p className="text-sm text-gray-600">Notify users who haven't been active</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.idleUsers.enabled}
              onChange={(e) => handleSettingChange('idleUsers', 'enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>

        {settings.idleUsers.enabled && (
          <div className="space-y-4 mt-4 pl-4 border-l-4 border-orange-500">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days Inactive Threshold
              </label>
              <input
                type="number"
                min="1"
                value={settings.idleUsers.daysInactive}
                onChange={(e) => handleSettingChange('idleUsers', 'daysInactive', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Users inactive for this many days will be notified</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notification Message</label>
              <textarea
                value={settings.idleUsers.message}
                onChange={(e) => handleSettingChange('idleUsers', 'message', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-700">Last Run</p>
                <p className="text-xs text-gray-500">{lastRun.idleUsers}</p>
              </div>
              <button
                onClick={() => handleTestNotification('idleUsers')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Send Test
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <button
          onClick={handleSave}
          className="w-full gradient-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
