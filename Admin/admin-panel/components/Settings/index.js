'use client';

import { useState } from 'react';
import ThemeManagement from './ThemeManagement';
import GeneralSettings from './GeneralSettings';
import SiteSettings from './SiteSettings';

export default function Settings({ user }) {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General Settings', icon: '⚙️' },
    { id: 'theme', label: 'Festival Themes', icon: '🎨' },
    { id: 'site', label: 'Site Support & Branding', icon: '🌐' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your admin panel preferences and appearance</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'general' && <GeneralSettings user={user} onSwitchToTheme={() => setActiveTab('theme')} />}
      {activeTab === 'theme' && <ThemeManagement />}
      {activeTab === 'site' && <SiteSettings />}
    </div>
  );
}
