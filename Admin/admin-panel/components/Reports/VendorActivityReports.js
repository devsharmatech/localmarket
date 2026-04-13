'use client';

import { useState, useEffect } from 'react';

export default function VendorActivityReports() {
  const [sortBy, setSortBy] = useState('views');
  const [vendorActivity, setVendorActivity] = useState([]);
  const [activeVendors, setActiveVendors] = useState(0);
  const [inactiveVendors, setInactiveVendors] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendorActivity();
  }, [sortBy]);

  const loadVendorActivity = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/vendor-activity?sortBy=${sortBy}`);
      if (res.ok) {
        const data = await res.json();
        setVendorActivity(data.vendors || []);
        setActiveVendors(data.activeVendors || 0);
        setInactiveVendors(data.inactiveVendors || 0);
      }
    } catch (error) {
      console.error('Error loading vendor activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastActive = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="views">Most Views</option>
            <option value="updates">Most Price Updates</option>
            <option value="completeness">Profile Completeness</option>
          </select>
        </div>
      </div>

      {/* Active vs Inactive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Active Vendors</h3>
          <div className="text-3xl font-bold text-green-600 mb-2">{activeVendors}</div>
          <p className="text-sm text-gray-600">Vendors active in last 7 days</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Inactive Vendors</h3>
          <div className="text-3xl font-bold text-red-600 mb-2">{inactiveVendors}</div>
          <p className="text-sm text-gray-600">Vendors inactive for 7+ days</p>
        </div>
      </div>

      {/* Vendor Activity Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Vendor Activity Details</h2>
          <button
            onClick={loadVendorActivity}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading vendor activity...</div>
        ) : vendorActivity.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No vendor activity data found</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price Updates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">View Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completeness</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vendorActivity.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      vendor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{vendor.priceUpdates}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{vendor.viewCount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${vendor.completeness}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{vendor.completeness}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatLastActive(vendor.lastActive)}</td>
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



