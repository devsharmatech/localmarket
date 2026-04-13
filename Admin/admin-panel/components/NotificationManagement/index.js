'use client';

import { useState } from 'react';
import SendNotificationForm from './SendNotificationForm';
import NotificationHistory from './NotificationHistory';
import AutoNotificationSettings from '../AutoNotifications/AutoNotificationSettings';

export default function NotificationManagement() {
  const [activeTab, setActiveTab] = useState('send');

  const tabs = [
    { id: 'send', label: 'Send Notification' },
    { id: 'history', label: 'Notification History' },
    { id: 'auto', label: 'Auto Notifications' },
  ];

  return (
    <div className="p-8">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'send' && <SendNotificationForm />}
      {activeTab === 'history' && <NotificationHistory />}
      {activeTab === 'auto' && <AutoNotificationSettings />}
    </div>
  );
}



