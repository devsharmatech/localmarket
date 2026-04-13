'use client';

import { useState, useEffect } from 'react';

export default function PriceVerification() {
  const [threshold, setThreshold] = useState(20);
  const [autoAlertEnabled, setAutoAlertEnabled] = useState(true);
  const [flaggedProducts, setFlaggedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    loadFlags();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/price-verification/settings');
      if (res.ok) {
        const settings = await res.json();
        setThreshold(settings.threshold_percent || 20);
        setAutoAlertEnabled(settings.auto_alert_enabled !== false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadFlags = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/price-verification/flags?status=pending');
      if (res.ok) {
        const flags = await res.json();
        setFlaggedProducts(flags.map(flag => ({
          id: flag.id,
          productName: flag.product_name,
          vendorName: flag.vendor_name,
          oldPrice: flag.old_price ? `₹${flag.old_price}` : 'N/A',
          newPrice: `₹${flag.new_price}`,
          marketAverage: flag.market_average ? `₹${flag.market_average}` : 'N/A',
          flagReason: flag.flag_reason === 'price_too_high' ? 'Price too high' : 'Price too low',
          flaggedDate: new Date(flag.flagged_at).toLocaleDateString(),
        })));
      }
    } catch (error) {
      console.error('Error loading flags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/price-verification/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threshold_percent: threshold,
          auto_alert_enabled: autoAlertEnabled,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert('Settings saved successfully!');
      } else {
        alert(data?.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(`Failed to save settings: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (productId, action) => {
    try {
      let status = 'pending';
      if (action === 'warn') status = 'warned';
      else if (action === 'hide') status = 'hidden';
      else if (action === 'block') status = 'vendor_blocked';

      const res = await fetch('/api/price-verification/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productId,
          status,
        }),
      });

      if (res.ok) {
        await loadFlags();
        alert(`Action "${action}" completed successfully`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to update flag');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Failed to perform action');
    }
  };

  return (
    <div className="p-8">
      {/* Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Flagging Engine Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Deviation Threshold: {threshold}%
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Products with prices deviating more than {threshold}% from market average will be flagged
            </p>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoAlertEnabled}
                onChange={(e) => setAutoAlertEnabled(e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label className="text-sm text-gray-700">Enable Auto-Alerts</label>
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Auto-alerts Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Auto-alerts Active</h3>
            <p className="mt-1 text-sm text-blue-700">
              {autoAlertEnabled
                ? `When a product price is outside the defined threshold (${threshold}%), an alert is automatically generated.`
                : 'Auto-alerts are currently disabled. Enable them in settings above.'}
            </p>
          </div>
        </div>
      </div>

      {/* Flagged Products */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Flagged Products</h2>
          <button
            onClick={loadFlags}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading flagged products...</div>
        ) : flaggedProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No flagged products found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Old Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market Avg</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flag Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {flaggedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                      <div className="text-xs text-gray-500">{product.flaggedDate}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.vendorName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.oldPrice}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-red-600">{product.newPrice}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.marketAverage}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {product.flagReason}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleAction(product.id, 'warn')}
                          className="text-yellow-600 hover:text-yellow-900 text-xs font-medium"
                        >
                          Warn Vendor
                        </button>
                        <button
                          onClick={() => handleAction(product.id, 'hide')}
                          className="text-orange-600 hover:text-orange-900 text-xs font-medium"
                        >
                          Hide Product
                        </button>
                        <button
                          onClick={() => handleAction(product.id, 'block')}
                          className="text-red-600 hover:text-red-900 text-xs font-medium"
                        >
                          Block Vendor
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
