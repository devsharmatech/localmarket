'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CircleAnalytics() {
  const [selectedCircle, setSelectedCircle] = useState('All');
  const [circles, setCircles] = useState([]);
  const [useCircles, setUseCircles] = useState(true);
  const [groupingKey, setGroupingKey] = useState('circle');
  const [categoryDemandData, setCategoryDemandData] = useState([]);
  const [circleUserLimits, setCircleUserLimits] = useState([]);
  const [userEngagement, setUserEngagement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [selectedCircle]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const circleParam = selectedCircle === 'All' ? '' : `?circle=${encodeURIComponent(selectedCircle)}`;
      const res = await fetch(`/api/analytics/circle${circleParam}`);

      if (res.ok) {
        const data = await res.json();
        console.log('Circle Analytics Response:', data);
        setCircles(['All', ...(data.circles || [])]);
        setUseCircles(data.useCircles !== false); // Default to true if not specified
        setGroupingKey(data.groupingKey || 'circle');
        setCategoryDemandData(data.categoryDemandData || []);
        setCircleUserLimits(data.circleUserLimits || []);
        setUserEngagement(data.userEngagement || []);

        // Show warning if no data
        if ((data.circles || []).length === 0) {
          setError(`No ${data.groupingKey || 'circle'}s found. Analytics will show data by ${data.groupingKey || 'city'} when available.`);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load analytics');
      }
    } catch (err) {
      console.error('Error loading circle analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const displayLabel = useCircles ? 'Circle' : 'City';
  const displayLabelPlural = useCircles ? 'Circles' : 'Cities';

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {displayLabel} Analytics
        {!useCircles && (
          <span className="text-sm font-normal text-gray-500 ml-2">(Using Cities - Circles are optional)</span>
        )}
      </h1>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="font-semibold">Error</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      )}


      {loading && (
        <div className="text-center py-12 text-gray-500">Loading analytics data...</div>
      )}

      {!loading && circles.length === 1 && circles[0] === 'All' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-6 mb-6">
          <div className="font-semibold mb-2">⚠️ No {displayLabelPlural} Found</div>
          <div className="text-sm">
            <p className="mb-2">To see {displayLabel.toLowerCase()} analytics, you need to:</p>
            <ul className="list-disc list-inside space-y-1">
              {useCircles ? (
                <>
                  <li>Add locations with circles assigned (via Location Management)</li>
                  <li>Or add vendors with circles assigned</li>
                  <li>Or ensure search logs have location_circle data</li>
                </>
              ) : (
                <>
                  <li>Add locations with cities (via Location Management)</li>
                  <li>Or add vendors/users with city information</li>
                  <li>Or ensure search logs have location_city data</li>
                </>
              )}
            </ul>
            <p className="mt-3 font-semibold">How User Mapping Works:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Users are mapped to {displayLabelPlural.toLowerCase()} based on their State + City</li>
              <li>The system looks up the {displayLabel.toLowerCase()} from the locations table</li>
              <li>If circles are not available, the system automatically uses cities for analytics</li>
            </ul>
          </div>
        </div>
      )}

      {!loading && circles.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 mb-6">
          <div className="text-sm">
            <p className="font-semibold mb-1">ℹ️ Analytics Information</p>
            <p>
              {useCircles
                ? 'Users are automatically mapped to circles based on their State + City matching locations in the locations table.'
                : 'Users are automatically mapped to cities based on their location data. Circles are optional - when not available, analytics use cities instead.'
              }
              {' '}Check the browser console for detailed mapping statistics.
            </p>
          </div>
        </div>
      )}

      {!loading && (
        <>

          {/* Category-wise Max Demanding Products */}
          {categoryDemandData.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Category-wise Max Demanding Products - {selectedCircle}</h2>
              <>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={categoryDemandData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="searches" fill="#f97316" name="Searches" />
                    <Bar dataKey="purchases" fill="#16a34a" name="Purchases" />
                    <Bar dataKey="contacts" fill="#3b82f6" name="Contacts" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold">Category</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Searches</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Purchases</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Contacts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryDemandData.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-sm font-semibold">{item.category}</td>
                          <td className="py-3 px-4 text-sm">{item.searches.toLocaleString()}</td>
                          <td className="py-3 px-4 text-sm">{item.purchases.toLocaleString()}</td>
                          <td className="py-3 px-4 text-sm">{item.contacts.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            </div>
          )}

          {/* Maximum Users per Circle/City */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Maximum Users per {displayLabel}</h2>
            {circleUserLimits.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No {displayLabel.toLowerCase()} data available</div>
            ) : (
              <div className="space-y-4">
                {circleUserLimits.map((circle, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-gray-900">{circle.circle || circle.groupName}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${circle.percentage > 90 ? 'bg-red-100 text-red-800' :
                        circle.percentage > 75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                        {circle.percentage}% Full
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Current Users: {circle.currentUsers.toLocaleString()}</span>
                        <span>Max Users: {circle.maxUsers.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${circle.percentage > 90 ? 'bg-red-600' :
                            circle.percentage > 75 ? 'bg-yellow-600' :
                              'bg-green-600'
                            }`}
                          style={{ width: `${circle.percentage}%` }}
                        />
                      </div>
                    </div>
                    <button className="text-sm text-orange-600 hover:text-orange-700 font-semibold">
                      Update Limit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Engagement Tracking */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Users and Vendors by {displayLabel}</h2>
            {userEngagement.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No engagement data available</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userEngagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="circle" label={{ value: displayLabel, position: 'insideBottom', offset: -5 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="users" fill="#16a34a" name="Users" />
                    <Bar dataKey="vendors" fill="#3b82f6" name="Vendors" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold">{displayLabel}</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Users</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Vendors</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userEngagement.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4 text-sm font-semibold">{item.circle || item.groupName}</td>
                          <td className="py-3 px-4 text-sm">{item.users.toLocaleString()}</td>
                          <td className="py-3 px-4 text-sm">{item.vendors.toLocaleString()}</td>
                          <td className="py-3 px-4 text-sm font-semibold">{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
