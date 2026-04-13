'use client';

import { useState, useEffect, useMemo } from 'react';

export default function SearchReports() {
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterType, setFilterType] = useState('state'); // 'state' or 'city'
  const [topSearches, setTopSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Load locations for the dropdown
  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLocationsLoading(true);
        const res = await fetch('/api/locations?limit=2000', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data?.locations)) {
          setLocations(data.locations);
        }
      } catch (error) {
        console.error('Error loading locations:', error);
      } finally {
        setLocationsLoading(false);
      }
    };
    loadLocations();
  }, []);

  useEffect(() => {
    loadSearchReports();
  }, [filterLocation, filterType]);

  const loadSearchReports = async () => {
    try {
      setLoading(true);
      let url = '/api/reports/search';
      if (filterLocation !== 'all') {
        url += `?${filterType}=${encodeURIComponent(filterLocation)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTopSearches(data);
      }
    } catch (error) {
      console.error('Error loading search reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique states and cities from locations
  const states = useMemo(() => {
    return Array.from(new Set(locations.map(l => l.state).filter(Boolean))).sort();
  }, [locations]);

  const cities = useMemo(() => {
    return Array.from(new Set(locations.map(l => l.city).filter(Boolean))).sort();
  }, [locations]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Location</label>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterLocation('all'); // Reset location when changing type
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="state">State</option>
                <option value="city">City</option>
              </select>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={locationsLoading}
              >
                <option value="all">All {filterType === 'state' ? 'States' : 'Cities'}</option>
                {(filterType === 'state' ? states : cities).map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            {locationsLoading && (
              <p className="text-xs text-gray-500 mt-1">Loading locations...</p>
            )}
            {!locationsLoading && locations.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No locations found. Import locations via Location Management.</p>
            )}
          </div>
          <div className="flex items-end">
            <button className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition">
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Top Searched Products */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Highest Searched Products</h2>
          <button
            onClick={loadSearchReports}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading search reports...</div>
        ) : topSearches.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No search data found</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Search Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topSearches.map((search, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{search.product}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{search.count.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{search.location}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-green-600">{search.trend}</span>
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



