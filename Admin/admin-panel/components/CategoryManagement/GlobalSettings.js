'use client';

import { useState } from 'react';

export default function GlobalSettings() {
  const [settings, setSettings] = useState({
    standardUnits: ['Piece', 'Kg', 'Litre', 'Pack', 'Box', 'Dozen'],
    taxEnabled: false,
    priceUpdateFrequency: 'weekly',
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Global Settings</h2>

        {/* Standard Units */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Standard Units</label>
          <div className="flex flex-wrap gap-2">
            {settings.standardUnits.map((unit, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-700">{unit}</span>
                <button className="text-red-600 hover:text-red-800">
                  ×
                </button>
              </div>
            ))}
            <button className="px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-500 hover:text-orange-600 transition">
              + Add Unit
            </button>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="mb-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.taxEnabled}
              onChange={(e) => setSettings({ ...settings, taxEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">Enable Tax Flags</span>
          </label>
          <p className="mt-2 text-xs text-gray-500">Enable tax calculation for products (if needed later)</p>
        </div>

        {/* Price Update Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price Update Frequency</label>
          <select
            value={settings.priceUpdateFrequency}
            onChange={(e) => setSettings({ ...settings, priceUpdateFrequency: e.target.value })}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <button className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}



