'use client';

import { useState, useEffect } from 'react';
import { FESTIVAL_THEMES } from '../../constants/festivalThemes';
export default function GeneralSettings({ user, onSwitchToTheme }) {
  const [currentTheme, setCurrentTheme] = useState('diwali');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);

  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedFestivalTheme') || 'diwali';
    setCurrentTheme(savedTheme);

    const savedNotifications = localStorage.getItem('notificationsEnabled');
    if (savedNotifications !== null) {
      setNotificationsEnabled(savedNotifications === 'true');
    }

    const savedAutoRefresh = localStorage.getItem('autoRefresh');
    if (savedAutoRefresh !== null) {
      setAutoRefresh(savedAutoRefresh === 'true');
    }

    const savedInterval = localStorage.getItem('refreshInterval');
    if (savedInterval) {
      setRefreshInterval(parseInt(savedInterval, 10));
    }
  }, []);

  const handleNotificationsToggle = (enabled) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('notificationsEnabled', enabled.toString());
  };

  const handleAutoRefreshToggle = (enabled) => {
    setAutoRefresh(enabled);
    localStorage.setItem('autoRefresh', enabled.toString());
  };

  const handleIntervalChange = (interval) => {
    setRefreshInterval(interval);
    localStorage.setItem('refreshInterval', interval.toString());
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (!user?.id) {
      setPasswordMessage({ type: 'error', text: 'User session not found. Please log in again.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to update password' });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Theme Display */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Current Theme</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{FESTIVAL_THEMES[currentTheme]?.icon || '🎨'}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{FESTIVAL_THEMES[currentTheme]?.name || 'Default'}</h3>
              <p className="text-sm text-gray-600">{FESTIVAL_THEMES[currentTheme]?.description || 'Current theme'}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onSwitchToTheme) {
                onSwitchToTheme();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="ml-auto px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
          >
            Change Theme
          </button>
        </div>
      </div>

      {/* Security - Change Password */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Security Settings</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          {passwordMessage.text && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {passwordMessage.text}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            {isUpdatingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Enable Notifications</h3>
              <p className="text-sm text-gray-600">Receive push notifications for important updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => handleNotificationsToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Auto Refresh Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Auto Refresh Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Enable Auto Refresh</h3>
              <p className="text-sm text-gray-600">Automatically refresh dashboard data at intervals</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => handleAutoRefreshToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>

          {autoRefresh && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Refresh Interval (seconds)
              </label>
              <select
                value={refreshInterval}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value, 10))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">System Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Admin Panel Version</span>
            <span className="font-semibold text-gray-900">v1.0.3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Current Theme</span>
            <span className="font-semibold text-gray-900">{FESTIVAL_THEMES[currentTheme]?.name || 'Default'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Notifications</span>
            <span className="font-semibold text-gray-900">{notificationsEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Auto Refresh</span>
            <span className="font-semibold text-gray-900">{autoRefresh ? `Every ${refreshInterval}s` : 'Disabled'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
