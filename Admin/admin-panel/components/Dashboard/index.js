'use client';

import { useState, useEffect } from 'react';
import UserManagement from './UserManagement';
import SendNotification from '../SendNotification';
import ValueFeedback from '../FeedbackManagement/ValueFeedback';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState([
    { label: 'Total Vendors', value: '0', change: '+0%', icon: '🏪' },
    { label: 'Active Vendors', value: '0', change: '+0%', icon: '✅' },
    { label: 'Pending Approvals', value: '0', change: '+0%', icon: '⏳' },
    { label: 'Total Categories', value: '0', change: '+0%', icon: '📁' },
    { label: 'Master Products', value: '0', change: '+0%', icon: '📋' },
    { label: 'Vendor Products', value: '0', change: '+0%', icon: '📦' },
    { label: 'Flagged Products', value: '0', change: '+0', icon: '⚠️' },
    { label: 'Daily Searches', value: '0', change: '+0%', icon: '🔍' },
    { label: 'Total Users', value: '0', change: '+0%', icon: '👥' },
  ]);
  const [searchVolumeData, setSearchVolumeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports/dashboard', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));

      if (res.ok && !data.error) {
        setDashboardData(data);
        console.log('Dashboard data loaded:', data);

        // Update stats with real data
        setStats([
          { label: 'Total Vendors', value: (data.totalVendors ?? 0).toLocaleString(), change: data.vendorChange || '+0%', icon: '🏪' },
          { label: 'Active Vendors', value: (data.activeVendors ?? 0).toLocaleString(), change: data.activeVendorChange || '+0%', icon: '✅' },
          { label: 'Pending Approvals', value: (data.pendingApprovals ?? 0).toLocaleString(), change: data.pendingChange || '+0%', icon: '⏳' },
          { label: 'Total Categories', value: (data.totalCategories ?? 0).toLocaleString(), change: data.categoryChange || '+0%', icon: '📁' },
          { label: 'Master Products', value: (data.totalMasterProducts ?? 0).toLocaleString(), change: data.masterProductChange || '+0%', icon: '📋' },
          { label: 'Vendor Products', value: (data.totalProducts ?? 0).toLocaleString(), change: data.productChange || '+0%', icon: '📦' },
          { label: 'Flagged Products', value: (data.flaggedProducts ?? 0).toLocaleString(), change: data.flaggedChange || '+0', icon: '⚠️' },
          { label: 'Daily Searches', value: (data.dailySearches ?? 0).toLocaleString(), change: data.searchChange || '+0%', icon: '🔍' },
          { label: 'Total Users', value: (data.totalUsers ?? 0).toLocaleString(), change: data.userChange || '+0%', icon: '👥' },
        ]);

        // Update search volume trends
        if (data.searchTrends && Array.isArray(data.searchTrends) && data.searchTrends.length > 0) {
          setSearchVolumeData(data.searchTrends);
        }
      } else {
        console.error('Dashboard API error:', data.error || 'Unknown error');
        // Keep default stats (all zeros) if API fails
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    if (!onNavigate) return;

    switch (action) {
      case 'review-pending':
        // Navigate to vendors section
        onNavigate('vendors');
        break;
      case 'flagged-products':
        // Navigate to price verification section
        onNavigate('price-verification');
        break;
      case 'view-reports':
        // Navigate to reports section
        onNavigate('reports');
        break;
      default:
        break;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'User Management' },
    { id: 'notifications', label: 'Send Notification' },
    { id: 'feedback', label: 'Value Feedback' },
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
      {activeTab === 'overview' && (
        <>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading dashboard data...</div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">{stat.icon}</span>
                      <span className={`text-sm font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {stat.change}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Search Volume Trends */}
              {searchVolumeData.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Search Volume Trends</h2>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={searchVolumeData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="date"
                          stroke="#6B7280"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis
                          stroke="#6B7280"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '8px'
                          }}
                          labelStyle={{ color: '#374151', fontWeight: '600' }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="searches"
                          name="Search Volume"
                          stroke="#E86A2C"
                          strokeWidth={3}
                          dot={{ fill: '#E86A2C', r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Search Volume Trends</h2>
                  <div className="text-center py-8 text-gray-500">No search data available</div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Vendors with High Views</h3>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {dashboardData?.vendorsWithHighViews?.toLocaleString() || '0'}
                  </div>
                  <p className="text-sm text-gray-600">But low listing completeness</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Most Price Updates</h3>
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {dashboardData?.priceUpdatesCount?.toLocaleString() || '0'}
                  </div>
                  <p className="text-sm text-gray-600">Vendors in last 7 days</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Pending Actions</h3>
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {dashboardData?.pendingActions?.toLocaleString() || '0'}
                  </div>
                  <p className="text-sm text-gray-600">Require immediate attention</p>
                </div>
              </div>

              {/* Vendor Performance Insights Summary */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Vendor Performance Insights Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm font-medium text-blue-900 mb-1">High Views, Low Conversions</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardData?.insights?.highViewsLowConversions?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">Vendors need pricing/display improvements</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-sm font-medium text-yellow-900 mb-1">High Demand, Low Views</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {dashboardData?.insights?.highDemandLowViews?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">Listing quality issues detected</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm font-medium text-green-900 mb-1">Price Updates Needed</div>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData?.insights?.priceUpdatesNeeded?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-green-700 mt-1">Vendors haven't updated in 30+ days</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-sm font-medium text-purple-900 mb-1">Low Category Demand</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {dashboardData?.insights?.lowCategoryDemand?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-purple-700 mt-1">Need popular product suggestions</div>
                  </div>
                </div>
              </div>

              {/* Interpretation Guidance */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Interpretation Guidance for Admin</h2>
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-1">If: Users high + views high + conversions low</p>
                    <p className="text-sm text-blue-700">→ Vendor needs to improve pricing / display / offer incentives</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-900 mb-1">If: Users high + category demand high + views low</p>
                    <p className="text-sm text-yellow-700">→ Listing quality problem (image, title, relevance) - Admin should guide vendor</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-semibold text-green-900 mb-1">If: Users low in area</p>
                    <p className="text-sm text-green-700">→ Market stage early — Admin should assure & retain vendors</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="font-semibold text-purple-900 mb-1">If: Category demand low</p>
                    <p className="text-sm text-purple-700">→ Admin should suggest additional popular products to vendors</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-semibold text-red-900 mb-1">If: Vendor never updates price</p>
                    <p className="text-sm text-red-700">→ Users don't trust outdated listings - Admin should notify vendor</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleQuickAction('review-pending')}
                    className="gradient-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition shadow-md"
                  >
                    Review Pending Vendors
                  </button>
                  <button
                    onClick={() => handleQuickAction('flagged-products')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
                  >
                    Check Flagged Products
                  </button>
                  <button
                    onClick={() => handleQuickAction('view-reports')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-md"
                  >
                    View Reports
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'notifications' && <SendNotification />}
      {activeTab === 'feedback' && <ValueFeedback />}
    </div>
  );
}
