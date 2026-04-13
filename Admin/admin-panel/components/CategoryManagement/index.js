'use client';

import { useState } from 'react';
import CategoryMaster from './CategoryMaster';
import ProductImport from './ProductImport';
import ProductList from './ProductList';
import BulkPriceUpdate from './BulkPriceUpdate';
import GlobalSettings from './GlobalSettings';

export default function CategoryManagement() {
  const [activeTab, setActiveTab] = useState('categories');

  const tabs = [
    { id: 'categories', label: 'Category Master' },
    { id: 'import', label: 'Master Product Import' },
    { id: 'products', label: 'Product List' },
    { id: 'bulk-price', label: 'Bulk Price Update' },
    { id: 'settings', label: 'Global Settings' },
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
      {activeTab === 'categories' && <CategoryMaster />}
      {activeTab === 'import' && <ProductImport />}
      {activeTab === 'products' && <ProductList />}
      {activeTab === 'bulk-price' && <BulkPriceUpdate />}
      {activeTab === 'settings' && <GlobalSettings />}
    </div>
  );
}
