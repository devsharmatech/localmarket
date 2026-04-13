'use client';

import { useEffect, useMemo, useState } from 'react';
import { getStates, getCities } from '../../constants/locations';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [locationFilters, setLocationFilters] = useState({
    state: 'All',
    city: 'All',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const states = ['All', ...getStates()];
  const cities = locationFilters.state === 'All' ? ['All'] : ['All', ...getCities(locationFilters.state)];

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filterStatus !== 'all') {
      params.set('status', filterStatus === 'Inactive' ? 'Blocked' : filterStatus);
    }
    if (locationFilters.state && locationFilters.state !== 'All') params.set('state', locationFilters.state);
    if (locationFilters.city && locationFilters.city !== 'All') params.set('city', locationFilters.city);
    params.set('page', String(pagination.page));
    params.set('limit', String(pagination.limit));
    return params.toString();
  }, [searchQuery, filterStatus, locationFilters, pagination.page, pagination.limit]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/users${queryString ? `?${queryString}` : ''}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error || 'Failed to load users');
        } else if (!cancelled) {
          if (data.warning === 'offline_mode') {
            setError('Viewing offline data: Database unreachable');
          }
          setUsers(Array.isArray(data?.users) ? data.users : []);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load users');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const t = setTimeout(load, searchQuery ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [queryString, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchQuery, filterStatus, locationFilters.state, locationFilters.city]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: Number(newLimit), page: 1 }));
  };

  const formatLastActive = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatJoined = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleStatusChange = async (userId, newStatus) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) {
      return;
    }

    try {
      setUpdatingStatus(userId);
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || 'Failed to update status');
        return;
      }

      if (data.warning) {
        alert('Action pending: ' + data.warning);
        return;
      }

      // Update local state
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, status: newStatus } : u
      ));
    } catch (e) {
      alert(`Failed to update status: ${e.message}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleEdit = (user) => {
    setEditingUser({ ...user });
  };

  const handleSaveEdit = async () => {
    if (!editingUser.name?.trim()) {
      alert('User name is required');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          full_name: editingUser.name,
          email: editingUser.email,
          phone: editingUser.phone,
          state: editingUser.state,
          city: editingUser.city,
          status: editingUser.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || 'Failed to update user');
        return;
      }

      if (data.warning) {
        alert('Action pending: ' + data.warning);
        return;
      }

      // Reload users with current pagination
      const reloadParams = new URLSearchParams();
      if (searchQuery) reloadParams.set('q', searchQuery);
      if (filterStatus !== 'all') {
        reloadParams.set('status', filterStatus === 'Inactive' ? 'Blocked' : filterStatus);
      }
      if (locationFilters.state && locationFilters.state !== 'All') reloadParams.set('state', locationFilters.state);
      if (locationFilters.city && locationFilters.city !== 'All') reloadParams.set('city', locationFilters.city);
      reloadParams.set('page', String(pagination.page));
      reloadParams.set('limit', String(pagination.limit));

      const loadRes = await fetch(`/api/users?${reloadParams.toString()}`, { cache: 'no-store' });
      const loadData = await loadRes.json().catch(() => ({}));
      if (loadRes.ok) {
        if (Array.isArray(loadData?.users)) {
          setUsers(loadData.users);
        }
        if (loadData.pagination) {
          setPagination(loadData.pagination);
        }
      }

      setEditingUser(null);
      alert('User updated successfully');
    } catch (e) {
      alert(`Failed to update user: ${e.message}`);
    }
  };

  const handleLocationFilterChange = (key, value) => {
    setLocationFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      // Reset dependent filters
      if (key === 'state') {
        newFilters.city = 'All';
      }
      return newFilters;
    });
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
  };

  const handleBack = () => {
    setSelectedUser(null);
  };

  if (selectedUser) {
    return (
      <div className="space-y-6">
        <button
          onClick={handleBack}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to User List
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedUser.name}</h2>
              <p className="text-gray-600">{selectedUser.email}</p>
            </div>
            <span className={`px-4 py-2 text-sm font-semibold rounded-full ${selectedUser.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
              {selectedUser.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
              <p className="text-gray-900 font-medium">{selectedUser.phone}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
              <p className="text-gray-900 font-medium">
                {[selectedUser.city, selectedUser.state].filter(Boolean).join(', ') || '—'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Joined Date</label>
              <p className="text-gray-900 font-medium">{formatJoined(selectedUser.joinedDate)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Last Active</label>
              <p className="text-gray-900 font-medium">{formatLastActive(selectedUser.lastActiveAt)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="font-semibold">User API error</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImport(!showImport)}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              📤 Import Users
            </button>
            {users.length > 0 && (
              <button
                onClick={async () => {
                  try {
                    const params = new URLSearchParams();
                    if (filterStatus !== 'all') params.set('status', filterStatus === 'Inactive' ? 'Blocked' : filterStatus);
                    if (searchQuery) params.set('q', searchQuery);
                    const res = await fetch(`/api/users/export?${params.toString()}`, { cache: 'no-store' });
                    if (!res.ok) {
                      const errorData = await res.json().catch(() => ({}));
                      alert(errorData.error || 'Failed to export');
                      return;
                    }
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  } catch (e) {
                    alert(`Failed to export: ${e.message}`);
                  }
                }}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                📥 Export Users
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'Active', 'Pending', 'Blocked'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status === 'all' ? 'all' : status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${filterStatus === (status === 'all' ? 'all' : status)
                  ? 'gradient-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {status}
              </button>
            ))}
            {loading && <span className="text-sm text-gray-600 ml-2">Loading…</span>}
          </div>
        </div>
      </div>

      {/* Location Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Location Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <select
              value={locationFilters.state}
              onChange={(e) => handleLocationFilterChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <select
              value={locationFilters.city}
              onChange={(e) => handleLocationFilterChange('city', e.target.value)}
              disabled={locationFilters.state === 'All'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Total: {pagination.total} user(s)
          </p>
          <button
            onClick={() => setLocationFilters({ state: 'All', city: 'All' })}
            className="text-sm text-orange-600 hover:text-orange-800 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Import Section */}
      {showImport && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk User Import</h2>
          <p className="text-gray-600 mb-6">
            Upload an Excel/CSV file to bulk import users. The file should contain full names, phone numbers, and optional email addresses. Download the template to see the required format.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Excel/CSV File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-500 transition">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer rounded-md font-medium text-orange-600 hover:text-orange-500">
                    <span>Upload a file</span>
                    <input type="file" className="sr-only" accept=".xlsx,.xls,.csv" onChange={handleImportFile} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">Excel (.xlsx, .xls) or CSV files</p>
                {importFile && (
                  <p className="text-sm text-gray-900 mt-2">
                    Selected: <span className="font-medium">{importFile.name}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              📥 Download Template
            </button>
            <button
              onClick={handleImport}
              disabled={!importFile || importLoading}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importLoading ? 'Importing...' : '📤 Import Users'}
            </button>
            <button
              onClick={() => {
                setShowImport(false);
                setImportFile(null);
                setImportResult(null);
              }}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>

          {importResult && (
            <div className={`mt-6 p-4 rounded-lg ${importResult.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
              <div className="font-semibold mb-2">
                {importResult.success ? '✅ Success' : '❌ Error'}
              </div>
              <div className="text-sm whitespace-pre-line">{importResult.message}</div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3 text-sm">
                  <div className="font-semibold mb-1">Row Errors:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {importResult.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx}>Row {error.row}: {error.error}</li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li className="text-gray-600">... and {importResult.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            {searchQuery || filterStatus !== 'all' || locationFilters.state !== 'All' || locationFilters.city !== 'All'
              ? 'No users found matching your filters.'
              : 'No users found.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{user.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{user.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {[user.city, user.state].filter(Boolean).join(', ') || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{formatJoined(user.joinedDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{formatLastActive(user.lastActiveAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.status || 'Active'}
                          onChange={(e) => handleStatusChange(user.id, e.target.value)}
                          disabled={updatingStatus === user.id}
                          className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer ${user.status === 'Active' ? 'bg-green-100 text-green-800' :
                            user.status === 'Blocked' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            } ${updatingStatus === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="Active">Active</option>
                          <option value="Pending">Pending</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  </span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-lg transition ${pagination.page === pageNum
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={editingUser.state || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={editingUser.city || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter city"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={editingUser.status || 'Active'}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Total Users</div>
          <div className="text-3xl font-bold text-gray-900">{users.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Active Users</div>
          <div className="text-3xl font-bold text-green-600">
            {users.filter(u => u.status === 'Active').length}
          </div>
        </div>
      </div>
    </div>
  );
}
