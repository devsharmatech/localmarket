'use client';

import { useEffect, useMemo, useState } from 'react';
import { sendNotificationToTopic } from '../../lib/firebaseAdmin';

const locations = ['All', 'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Ahmedabad'];
const statuses = ['All', 'Active', 'Inactive', 'Pending', 'Blocked'];

export default function SendNotificationForm() {
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    recipientType: 'all', // 'all', 'users', 'vendors', 'custom'
  });

  const [userFilters, setUserFilters] = useState({
    search: '',
    location: 'All',
    status: 'All',
  });

  const [vendorFilters, setVendorFilters] = useState({
    search: '',
    location: 'All',
    status: 'All',
    kycStatus: 'All',
  });

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setDataLoading(true);
        const [uRes, vRes] = await Promise.all([
          fetch('/api/users?limit=500', { cache: 'no-store' }),
          fetch('/api/vendors', { cache: 'no-store' }),
        ]);
        const uData = await uRes.json().catch(() => ({}));
        const vData = await vRes.json().catch(() => ({}));
        if (!uRes.ok) throw new Error(uData?.error || 'Failed to load users');
        if (!vRes.ok) throw new Error(vData?.error || 'Failed to load vendors');
        if (!cancelled) {
          setUsers((uData?.users || []).map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            location: [u.city, u.state].filter(Boolean).join(', ') || '—',
            status: u.status,
          })));
          setVendors((vData?.vendors || []).map(v => ({
            id: v.id,
            name: v.name,
            owner: v.owner,
            email: v.email,
            phone: v.contactNumber || v.phone,
            location: [v.city, v.state].filter(Boolean).join(', ') || '—',
            status: v.status,
            kycStatus: v.kycStatus || v.kyc_status,
          })));
        }
      } catch (e) {
        if (!cancelled) setResult({ success: false, message: e?.message || 'Failed to load recipients' });
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Filter users
  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(userFilters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(userFilters.search.toLowerCase());
    const matchesLocation = userFilters.location === 'All' || user.location === userFilters.location;
    const matchesStatus = userFilters.status === 'All' || user.status === userFilters.status;
    return matchesSearch && matchesLocation && matchesStatus;
  }), [users, userFilters]);

  // Filter vendors
  const filteredVendors = useMemo(() => vendors.filter((vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(vendorFilters.search.toLowerCase()) ||
      vendor.owner.toLowerCase().includes(vendorFilters.search.toLowerCase());
    const matchesLocation = vendorFilters.location === 'All' || vendor.location === vendorFilters.location;
    const matchesStatus = vendorFilters.status === 'All' || vendor.status === vendorFilters.status;
    const matchesKyc = vendorFilters.kycStatus === 'All' || vendor.kycStatus === vendorFilters.kycStatus;
    return matchesSearch && matchesLocation && matchesStatus && matchesKyc;
  }), [vendors, vendorFilters]);

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleVendorToggle = (vendorId) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleSelectAllVendors = () => {
    if (selectedVendors.length === filteredVendors.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(filteredVendors.map(v => v.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const notification = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        id: Date.now(),
      };

      // Topic send (placeholder routes exist)
      const topic =
        formData.recipientType === 'all' ? 'all' :
          formData.recipientType === 'users' ? 'users' :
            formData.recipientType === 'vendors' ? 'vendors' :
              'all';
      await sendNotificationToTopic(topic, notification);

      // Persist to DB history
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience: topic,
          title: formData.title,
          message: formData.message,
          topic,
        }),
      });

      setResult({ success: true, message: 'Notification sent successfully!' });

      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info',
        recipientType: 'all',
      });
      setSelectedUsers([]);
      setSelectedVendors([]);
    } catch (error) {
      setResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {dataLoading && (
        <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 text-sm text-gray-700">
          Loading recipients…
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Send Notification</h2>

        <div className="space-y-6">
          {/* Notification Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Notification title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Notification message"
              rows={4}
              required
            />
          </div>

          {/* Recipient Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send To <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['all', 'users', 'vendors', 'custom'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, recipientType: type })}
                  className={`px-4 py-2 rounded-lg font-medium transition ${formData.recipientType === type
                      ? 'gradient-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* User Selection */}
          {formData.recipientType === 'users' && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Select Users</h3>
                <button
                  type="button"
                  onClick={handleSelectAllUsers}
                  className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                >
                  {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* User Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userFilters.search}
                  onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <select
                  value={userFilters.location}
                  onChange={(e) => setUserFilters({ ...userFilters, location: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <select
                  value={userFilters.status}
                  onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* User List */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email} • {user.location}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {user.status}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Selected: {selectedUsers.length} user(s)
              </p>
            </div>
          )}

          {/* Vendor Selection */}
          {formData.recipientType === 'vendors' && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Select Vendors</h3>
                <button
                  type="button"
                  onClick={handleSelectAllVendors}
                  className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                >
                  {selectedVendors.length === filteredVendors.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Vendor Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={vendorFilters.search}
                  onChange={(e) => setVendorFilters({ ...vendorFilters, search: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <select
                  value={vendorFilters.location}
                  onChange={(e) => setVendorFilters({ ...vendorFilters, location: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <select
                  value={vendorFilters.status}
                  onChange={(e) => setVendorFilters({ ...vendorFilters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <select
                  value={vendorFilters.kycStatus}
                  onChange={(e) => setVendorFilters({ ...vendorFilters, kycStatus: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="All">All KYC</option>
                  <option value="Verified">Verified</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Vendor List */}
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredVendors.map((vendor) => (
                  <label
                    key={vendor.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedVendors.includes(vendor.id)}
                      onChange={() => handleVendorToggle(vendor.id)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                      <div className="text-xs text-gray-500">{vendor.owner} • {vendor.location}</div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${vendor.status === 'Active' ? 'bg-green-100 text-green-800' :
                          vendor.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {vendor.status}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${vendor.kycStatus === 'Verified' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {vendor.kycStatus}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Selected: {selectedVendors.length} vendor(s)
              </p>
            </div>
          )}

          {/* Custom Selection (Both Users and Vendors) */}
          {formData.recipientType === 'custom' && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Select Users</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userFilters.search}
                    onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <select
                    value={userFilters.location}
                    onChange={(e) => setUserFilters({ ...userFilters, location: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <select
                    value={userFilters.status}
                    onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredUsers.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserToggle(user.id)}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Select Vendors</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Search vendors..."
                    value={vendorFilters.search}
                    onChange={(e) => setVendorFilters({ ...vendorFilters, search: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <select
                    value={vendorFilters.location}
                    onChange={(e) => setVendorFilters({ ...vendorFilters, location: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <select
                    value={vendorFilters.status}
                    onChange={(e) => setVendorFilters({ ...vendorFilters, status: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <select
                    value={vendorFilters.kycStatus}
                    onChange={(e) => setVendorFilters({ ...vendorFilters, kycStatus: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="All">All KYC</option>
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredVendors.map((vendor) => (
                    <label
                      key={vendor.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(vendor.id)}
                        onChange={() => handleVendorToggle(vendor.id)}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                        <div className="text-xs text-gray-500">{vendor.owner}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Selected: {selectedUsers.length} user(s) and {selectedVendors.length} vendor(s)
              </p>
            </div>
          )}

          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
              {result.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (formData.recipientType === 'users' && selectedUsers.length === 0) ||
              (formData.recipientType === 'vendors' && selectedVendors.length === 0) ||
              (formData.recipientType === 'custom' && selectedUsers.length === 0 && selectedVendors.length === 0)}
            className="w-full gradient-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </form>
    </div>
  );
}



