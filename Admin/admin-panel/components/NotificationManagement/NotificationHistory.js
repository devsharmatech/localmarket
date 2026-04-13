'use client';

import { useEffect, useMemo, useState } from 'react';

export default function NotificationHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    type: 'All',
    recipientType: 'All',
    dateRange: 'All',
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/notifications?limit=500`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Failed to load notifications');
        if (!cancelled) setHistory(Array.isArray(data?.notifications) ? data.notifications : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load notifications');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const filteredHistory = useMemo(() => history.filter((item) => {
    const title = (item.title || '').toLowerCase();
    const msg = (item.message || '').toLowerCase();
    const matchesSearch = title.includes(filters.search.toLowerCase()) || msg.includes(filters.search.toLowerCase());
    const matchesType = true; // type not stored in DB yet
    const matchesRecipient = filters.recipientType === 'All' || item.audience === filters.recipientType;
    
    let matchesDate = true;
    if (filters.dateRange !== 'All') {
      const itemDate = new Date(item.sent_at || item.created_at);
      const now = new Date();
      const diffDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
      
      if (filters.dateRange === 'Today' && diffDays !== 0) matchesDate = false;
      if (filters.dateRange === 'Last 7 days' && diffDays > 7) matchesDate = false;
      if (filters.dateRange === 'Last 30 days' && diffDays > 30) matchesDate = false;
    }
    
    return matchesSearch && matchesType && matchesRecipient && matchesDate;
  }), [history, filters]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getRecipientTypeLabel = (type) => {
    switch (type) {
      case 'all':
        return 'All Users & Vendors';
      case 'users':
        return 'Users';
      case 'vendors':
        return 'Vendors';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="font-semibold">Notification history API error</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      )}
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Notification History</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search notifications..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="All">All Types</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <select
            value={filters.recipientType}
            onChange={(e) => setFilters({ ...filters, recipientType: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="All">All Recipients</option>
            <option value="all">All</option>
            <option value="users">Users</option>
            <option value="vendors">Vendors</option>
          </select>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="Last 7 days">Last 7 days</option>
            <option value="Last 30 days">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-600">Loading…</div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">No notifications sent yet</p>
            <p className="text-sm mt-2">Notifications you send will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredHistory.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start gap-4">
                  <span className="text-2xl flex-shrink-0">
                    {getNotificationIcon('info')}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        'bg-green-100 text-green-800'
                      }`}>
                        Sent
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{item.message}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>
                        <span className="font-medium">Audience:</span> {item.audience}
                      </span>
                      <span>
                        <span className="font-medium">Recipients:</span> {getRecipientTypeLabel(item.audience)}
                      </span>
                      <span>
                        <span className="font-medium">Sent:</span> {formatDate(item.sent_at || item.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-gray-900">{filteredHistory.length}</div>
              <div className="text-sm text-gray-600">Total Notifications</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {filteredHistory.length}
              </div>
              <div className="text-sm text-gray-600">Sent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {filteredHistory.filter(h => h.audience === 'all').length}
              </div>
              <div className="text-sm text-gray-600">Broadcast</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {filteredHistory.filter(h => h.audience === 'users' || h.audience === 'vendors').length}
              </div>
              <div className="text-sm text-gray-600">Targeted</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



