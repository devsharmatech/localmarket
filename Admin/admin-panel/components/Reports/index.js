'use client';

import { useState } from 'react';
import SearchReports from './SearchReports';
import VendorActivityReports from './VendorActivityReports';
import OperationalDashboard from './OperationalDashboard';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Operational Dashboard' },
    { id: 'search', label: 'Search & Demand Reports' },
    { id: 'vendor-activity', label: 'Vendor Activity Reports' },
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
      {activeTab === 'dashboard' && <OperationalDashboard />}
      {activeTab === 'search' && <SearchReports />}
      {activeTab === 'vendor-activity' && <VendorActivityReports />}
    </div>
  );
}
