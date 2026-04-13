'use client';

import { useState } from 'react';
import VendorList from './VendorList';
import VendorApproval from './VendorApproval';
import VendorProfile from './VendorProfile';
import VendorImport from './VendorImport';

export default function VendorManagement() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedVendor, setSelectedVendor] = useState(null);

  const tabs = [
    { id: 'list', label: 'Vendor List & Status' },
    { id: 'approval', label: 'Approval Workflow' },
    { id: 'import', label: 'Import Vendors' },
  ];

  if (selectedVendor) {
    return (
      <VendorProfile
        vendor={selectedVendor}
        onBack={() => setSelectedVendor(null)}
      />
    );
  }

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
      {activeTab === 'list' && (
        <VendorList onViewProfile={(vendor) => setSelectedVendor(vendor)} />
      )}
      {activeTab === 'approval' && (
        <VendorApproval onViewProfile={(vendor) => setSelectedVendor(vendor)} />
      )}
      {activeTab === 'import' && (
        <VendorImport />
      )}
    </div>
  );
}
