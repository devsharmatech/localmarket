'use client';

import { COLORS } from '../constants/colors';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'users', label: 'User Management', icon: '👥' },
  { id: 'vendors', label: 'Vendor Management', icon: '🏪' },
  { id: 'categories', label: 'Category & Products', icon: '📦' },
  { id: 'price-verification', label: 'Price Verification', icon: '💰' },
  { id: 'payment-fees', label: 'Payment & Fees', icon: '💳' },
  { id: 'festive-offers', label: 'Festive Offers', icon: '🎉' },
  { id: 'banners', label: 'Banner Management', icon: '🖼️' },
  { id: 'featured', label: 'Home Featured', icon: '✨' },
  { id: 'e-auction', label: 'E-Auction & Draw', icon: '🎲' },
  { id: 'circle-analytics', label: 'Circle Analytics', icon: '📊' },
  { id: 'reports', label: 'Reports & Analytics', icon: '📈' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'locations', label: 'Location Management', icon: '📍' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ activeSection, setActiveSection, onLogout }) {
  return (
    <div className="w-64 bg-white border-r border-gray-100 h-full flex flex-col overflow-hidden">
      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 pt-6 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeSection === item.id
              ? 'gradient-primary text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Log Out</span>
        </button>
        <div className="text-xs text-gray-500 text-center pt-2">
          Local App v1.0.3
        </div>
      </div>
    </div>
  );
}
