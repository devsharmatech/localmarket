'use client';

import { useEffect, useMemo, useState } from 'react';

export default function ValueFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filter === 'pending') params.set('status', 'pending');
    if (filter === 'users') params.set('type', 'user');
    if (filter === 'vendors') params.set('type', 'vendor');
    return params.toString();
  }, [filter, searchQuery]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/feedback${queryString ? `?${queryString}` : ''}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error || 'Failed to load feedback');
        } else if (!cancelled) {
          if (data.warning === 'offline_mode') {
            setError('Viewing offline data: Database unreachable');
          }
          setFeedback(Array.isArray(data?.feedback) ? data.feedback : []);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load feedback');
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

  const filteredFeedback = feedback.filter((item) => {
    const matchesFilter = filter === 'all' ||
      (filter === 'pending' && item.status === 'pending') ||
      (filter === 'users' && item.type === 'user') ||
      (filter === 'vendors' && item.type === 'vendor');

    const matchesSearch = item.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.type === 'user' ? item.userName : item.vendorName).toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = (id, newStatus) => {
    // Optimistic UI + persist via API
    setFeedback(prev => prev.map(item => (item.id === id ? { ...item, status: newStatus } : item)));
    fetch('/api/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    }).then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'Failed to update feedback');
        // Revert on failure
        setFeedback(prev => prev.map(item => (item.id === id ? { ...item, status: 'pending' } : item)));
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.warning) {
          alert('Action pending: ' + data.warning);
          // Don't revert, since it's "saved" in offline mode logic (theoretically)
          // or just show the alert
        }
      }
    }).catch((e) => {
      // Revert on failure
      setFeedback(prev => prev.map(item => (item.id === id ? { ...item, status: 'pending' } : item)));
      setError(e?.message || 'Failed to update feedback');
    });
  };

  const getRatingStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-green-100 text-green-800';
      case 'resolved': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Value Feedback Management</h2>
        <p className="text-gray-600">Manage feedback from users and vendors</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="font-semibold">Feedback API error</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 items-center">
            {['all', 'pending', 'users', 'vendors'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-lg font-medium transition ${filter === filterType
                    ? 'gradient-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
            {loading && <span className="text-sm text-gray-600 ml-2">Loading…</span>}
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comment
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
              {!loading && filteredFeedback.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-600">
                    No feedback found.
                  </td>
                </tr>
              )}
              {filteredFeedback.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.type === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                      {item.type === 'user' ? '👤 User' : '🏪 Vendor'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.type === 'user' ? (item.userName || 'User') : (item.vendorName || 'Vendor')}
                      </div>
                      <div className="text-xs text-gray-500">{item.location}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getRatingStars(item.rating)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {item.comment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedFeedback(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(item.id, 'reviewed')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() => handleStatusChange(item.id, 'resolved')}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Feedback Details</h3>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedFeedback.type === 'user' ? '👤 User' : '🏪 Vendor'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">From</label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedFeedback.type === 'user' ? selectedFeedback.userName : selectedFeedback.vendorName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFeedback.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Rating</label>
                <p className="mt-1 text-sm">{getRatingStars(selectedFeedback.rating)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Comment</label>
                <p className="mt-1 text-sm text-gray-900">{selectedFeedback.comment}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedFeedback.status)}`}>
                    {selectedFeedback.status}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedFeedback.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              {selectedFeedback.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedFeedback.id, 'reviewed');
                      setSelectedFeedback(null);
                    }}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedFeedback.id, 'resolved');
                      setSelectedFeedback(null);
                    }}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    Resolve
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedFeedback(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
