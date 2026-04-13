import { NextResponse } from 'next/server';
import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

// GET /api/analytics/circle - Get circle analytics data
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const circle = searchParams.get('circle');

        // Get all locations to extract circles and cities
        let locations = [];
        try {
            locations = await supabaseRestGet('/rest/v1/locations?select=circle,city,state');
            console.log(`Found ${locations.length} locations`);
        } catch (e) {
            console.error('Error fetching locations:', e.message);
            locations = [];
        }

        // Extract unique circles
        const uniqueCircles = [...new Set(locations.map(l => l.circle).filter(Boolean))];
        console.log(`Unique circles found: ${uniqueCircles.join(', ') || 'None'}`);

        // Extract unique cities (for fallback when circles are not available)
        const uniqueCities = [...new Set(locations.map(l => l.city).filter(Boolean))];
        console.log(`Unique cities found: ${uniqueCities.join(', ') || 'None'}`);

        // If no circles, try getting circles from vendors
        if (uniqueCircles.length === 0) {
            try {
                const vendors = await supabaseRestGet('/rest/v1/vendors?select=circle,city&circle=not.is.null');
                const vendorCircles = [...new Set(vendors.map(v => v.circle).filter(Boolean))];
                if (vendorCircles.length > 0) {
                    console.log(`Found ${vendorCircles.length} circles from vendors: ${vendorCircles.join(', ')}`);
                    uniqueCircles.push(...vendorCircles);
                }
                // Also get cities from vendors if needed
                const vendorCities = [...new Set(vendors.map(v => v.city).filter(Boolean))];
                vendorCities.forEach(city => {
                    if (!uniqueCities.includes(city)) uniqueCities.push(city);
                });
            } catch (e) {
                console.warn('Could not fetch circles from vendors:', e.message);
            }
        }

        // Determine if we should use circles or cities
        const useCircles = uniqueCircles.length > 0;
        const groupingKey = useCircles ? 'circle' : 'city';
        const groupingValues = useCircles ? uniqueCircles : uniqueCities;

        console.log(`Using ${groupingKey} for analytics: ${groupingValues.length} ${groupingKey}s available`);

        // Get search logs with all needed fields
        // Try to get location_circle, but fallback if column doesn't exist
        let allSearchLogs = [];
        try {
            allSearchLogs = await supabaseRestGet('/rest/v1/search_logs?select=location_circle,user_id,search_query,searched_at,location_state,location_city');
        } catch (e) {
            // If location_circle doesn't exist, try without it and derive circle from location data
            console.warn('location_circle column not found, trying alternative query:', e.message);
            try {
                const logsWithoutCircle = await supabaseRestGet('/rest/v1/search_logs?select=user_id,search_query,searched_at,location_state,location_city,location_town');
                // Map logs to include location_circle by looking up in locations table
                const locationMap = {};
                locations.forEach(loc => {
                    const key = `${loc.state || ''}_${loc.city || ''}_${loc.town || ''}`;
                    if (loc.circle) {
                        locationMap[key] = loc.circle;
                    }
                });

                allSearchLogs = logsWithoutCircle.map(log => ({
                    ...log,
                    location_circle: locationMap[`${log.location_state || ''}_${log.location_city || ''}_${log.location_town || ''}`] || null
                }));
            } catch (e2) {
                console.error('Error fetching search logs:', e2.message);
                // Return empty array if search_logs table doesn't exist
                allSearchLogs = [];
            }
        }

        // Create mappings: state+city to circle/city
        const locationToGroupMap = {}; // Maps state+city to circle or city
        const cityToStateMap = {}; // Maps city to state (for city-based grouping)

        if (Array.isArray(locations)) {
            locations.forEach(loc => {
                if (loc.state && loc.city) {
                    const stateCityKey = `${loc.state}_${loc.city}`;

                    if (useCircles && loc.circle) {
                        // Map to circle if available
                        if (!locationToGroupMap[stateCityKey]) {
                            locationToGroupMap[stateCityKey] = loc.circle;
                        }
                    } else {
                        // Map to city as fallback
                        if (!locationToGroupMap[stateCityKey]) {
                            locationToGroupMap[stateCityKey] = loc.city;
                        }
                    }

                    // Store city to state mapping
                    if (!cityToStateMap[loc.city]) {
                        cityToStateMap[loc.city] = loc.state;
                    }
                }
            });
        }
        console.log(`Created location-to-${groupingKey} mapping for ${Object.keys(locationToGroupMap).length} state+city combinations`);

        // Get all users and map them to circles based on their state and city
        let allUsers = [];
        try {
            allUsers = await supabaseRestGet('/rest/v1/users?select=id,state,city');
            console.log(`Found ${allUsers.length} users`);
        } catch (e) {
            console.error('Error fetching users:', e.message);
            allUsers = [];
        }

        // Count users by circle/city from user location data
        const usersByGroupFromUsers = {};
        const uniqueUsersByGroupFromUsers = {};
        if (Array.isArray(allUsers)) {
            allUsers.forEach(user => {
                if (user.state && user.city) {
                    const key = `${user.state}_${user.city}`;
                    const groupValue = locationToGroupMap[key] || (useCircles ? null : user.city);

                    if (groupValue) {
                        if (!uniqueUsersByGroupFromUsers[groupValue]) {
                            uniqueUsersByGroupFromUsers[groupValue] = new Set();
                        }
                        uniqueUsersByGroupFromUsers[groupValue].add(user.id);
                    }
                } else if (!useCircles && user.city) {
                    // If using cities and user has city but no state, still count them
                    if (!uniqueUsersByGroupFromUsers[user.city]) {
                        uniqueUsersByGroupFromUsers[user.city] = new Set();
                    }
                    uniqueUsersByGroupFromUsers[user.city].add(user.id);
                }
            });
        }

        // Convert sets to counts
        Object.keys(uniqueUsersByGroupFromUsers).forEach(groupValue => {
            usersByGroupFromUsers[groupValue] = uniqueUsersByGroupFromUsers[groupValue].size;
        });
        console.log(`Users mapped to ${groupingKey}s:`, usersByGroupFromUsers);

        // Also count unique users per circle/city from search logs (as backup/additional data)
        const usersByGroupFromLogs = {};
        const uniqueUsersByGroupFromLogs = {};
        if (Array.isArray(allSearchLogs)) {
            allSearchLogs.forEach(log => {
                let groupValue = null;

                if (useCircles && log.location_circle) {
                    groupValue = log.location_circle;
                } else if (!useCircles && log.location_city) {
                    groupValue = log.location_city;
                } else if (log.location_state && log.location_city) {
                    // Try to map from location
                    const key = `${log.location_state}_${log.location_city}`;
                    groupValue = locationToGroupMap[key] || (!useCircles ? log.location_city : null);
                }

                if (groupValue && log.user_id) {
                    if (!uniqueUsersByGroupFromLogs[groupValue]) {
                        uniqueUsersByGroupFromLogs[groupValue] = new Set();
                    }
                    uniqueUsersByGroupFromLogs[groupValue].add(log.user_id);
                }
            });
        }

        // Convert sets to counts
        Object.keys(uniqueUsersByGroupFromLogs).forEach(groupValue => {
            usersByGroupFromLogs[groupValue] = uniqueUsersByGroupFromLogs[groupValue].size;
        });

        // Merge user counts: prefer user table data, but also include search log data
        const usersByGroup = { ...usersByGroupFromUsers };
        Object.keys(usersByGroupFromLogs).forEach(groupValue => {
            // Use the maximum count from either source
            usersByGroup[groupValue] = Math.max(
                usersByGroup[groupValue] || 0,
                usersByGroupFromLogs[groupValue] || 0
            );
        });

        // Group searches by circle/city
        const searchesByGroup = {};
        if (Array.isArray(allSearchLogs)) {
            allSearchLogs.forEach(log => {
                let groupValue = 'Unknown';

                if (useCircles && log.location_circle) {
                    groupValue = log.location_circle;
                } else if (!useCircles && log.location_city) {
                    groupValue = log.location_city;
                } else if (log.location_state && log.location_city) {
                    const key = `${log.location_state}_${log.location_city}`;
                    groupValue = locationToGroupMap[key] || (!useCircles ? log.location_city : 'Unknown');
                }

                searchesByGroup[groupValue] = (searchesByGroup[groupValue] || 0) + 1;
            });
        }

        // Get vendors by circle/city
        let vendors = [];
        try {
            vendors = await supabaseRestGet('/rest/v1/vendors?select=id,circle,city,status');
        } catch (e) {
            console.error('Error fetching vendors:', e.message);
            vendors = [];
        }
        const vendorsByGroup = {};
        if (Array.isArray(vendors)) {
            vendors.forEach(vendor => {
                const groupValue = (useCircles && vendor.circle) ? vendor.circle : (vendor.city || 'Unknown');
                vendorsByGroup[groupValue] = (vendorsByGroup[groupValue] || 0) + 1;
            });
        }

        // Get category-wise demand for selected circle/city or all
        let categoryDemandData = [];
        const selectedGroup = circle || 'All';

        if (selectedGroup && selectedGroup !== 'All') {
            // Filter search logs by circle/city
            const groupSearchLogs = allSearchLogs.filter(log => {
                if (useCircles) {
                    return log.location_circle === selectedGroup;
                } else {
                    return log.location_city === selectedGroup;
                }
            });

            // Extract categories from search queries (simplified - you may need to map queries to categories)
            const categoryMap = {};
            groupSearchLogs.forEach(log => {
                // Simple category extraction - you might want to improve this based on your data
                const query = (log.search_query || '').toLowerCase();
                let category = 'Other';

                if (query.includes('groc') || query.includes('food') || query.includes('rice') || query.includes('dal')) {
                    category = 'Groceries';
                } else if (query.includes('electron') || query.includes('phone') || query.includes('mobile')) {
                    category = 'Electronics';
                } else if (query.includes('cloth') || query.includes('wear') || query.includes('shirt')) {
                    category = 'Clothing';
                } else if (query.includes('medic') || query.includes('pharma') || query.includes('tablet')) {
                    category = 'Medicines';
                } else if (query.includes('applian') || query.includes('fridge') || query.includes('washing')) {
                    category = 'Appliances';
                }

                if (!categoryMap[category]) {
                    categoryMap[category] = { searches: 0, purchases: 0, contacts: 0 };
                }
                categoryMap[category].searches += 1;
            });

            // Convert to array format
            categoryDemandData = Object.entries(categoryMap).map(([category, data]) => ({
                category,
                searches: data.searches,
                purchases: data.purchases || Math.floor(data.searches * 0.3), // Estimate purchases as 30% of searches
                contacts: data.contacts || Math.floor(data.searches * 0.5), // Estimate contacts as 50% of searches
            })).sort((a, b) => b.searches - a.searches);
        } else {
            // All circles - aggregate data
            const allCategoryMap = {};
            allSearchLogs.forEach(log => {
                const query = (log.search_query || '').toLowerCase();
                let category = 'Other';

                if (query.includes('groc') || query.includes('food') || query.includes('rice') || query.includes('dal')) {
                    category = 'Groceries';
                } else if (query.includes('electron') || query.includes('phone') || query.includes('mobile')) {
                    category = 'Electronics';
                } else if (query.includes('cloth') || query.includes('wear') || query.includes('shirt')) {
                    category = 'Clothing';
                } else if (query.includes('medic') || query.includes('pharma') || query.includes('tablet')) {
                    category = 'Medicines';
                } else if (query.includes('applian') || query.includes('fridge') || query.includes('washing')) {
                    category = 'Appliances';
                }

                if (!allCategoryMap[category]) {
                    allCategoryMap[category] = { searches: 0, purchases: 0, contacts: 0 };
                }
                allCategoryMap[category].searches += 1;
            });

            categoryDemandData = Object.entries(allCategoryMap).map(([category, data]) => ({
                category,
                searches: data.searches,
                purchases: data.purchases || Math.floor(data.searches * 0.3),
                contacts: data.contacts || Math.floor(data.searches * 0.5),
            })).sort((a, b) => b.searches - a.searches);
        }

        // Calculate circle/city user limits (assuming max users based on vendors or a default)
        const groupUserLimits = groupingValues.map(groupName => {
            const currentUsers = usersByGroup[groupName] || 0;
            // Default max users: 5000, or calculate based on vendors (e.g., 100 users per vendor)
            const vendorCount = vendorsByGroup[groupName] || 0;
            const maxUsers = Math.max(5000, vendorCount * 100);
            const percentage = maxUsers > 0 ? ((currentUsers / maxUsers) * 100).toFixed(1) : 0;

            return {
                circle: groupName, // Keep 'circle' key for backward compatibility
                groupName: groupName, // Add explicit groupName
                maxUsers,
                currentUsers,
                percentage: parseFloat(percentage),
                // Include breakdown for debugging
                usersFromUserTable: usersByGroupFromUsers[groupName] || 0,
                usersFromSearchLogs: usersByGroupFromLogs[groupName] || 0,
            };
        });

        // Calculate user engagement (users and vendors by circle/city)
        const userEngagement = groupingValues.map(groupName => {
            const users = usersByGroup[groupName] || 0;
            const vendors = vendorsByGroup[groupName] || 0;

            return {
                circle: groupName, // Keep 'circle' key for backward compatibility
                groupName: groupName, // Add explicit groupName
                users,
                vendors,
                total: users + vendors,
            };
        });

        // Log data for debugging
        console.log(`${groupingKey.charAt(0).toUpperCase() + groupingKey.slice(1)} Analytics Data:`, {
            useCircles,
            groupingKey,
            uniqueGroups: groupingValues.length,
            groups: groupingValues,
            locationsCount: locations.length,
            usersCount: allUsers.length,
            searchLogsCount: allSearchLogs.length,
            vendorsCount: vendors.length,
            usersByGroup: usersByGroup,
            categoryDemandDataCount: categoryDemandData.length,
            groupUserLimitsCount: groupUserLimits.length,
            userEngagementCount: userEngagement.length,
        });

        return NextResponse.json({
            circles: groupingValues, // Return circles or cities
            useCircles, // Indicate which grouping is being used
            groupingKey, // 'circle' or 'city'
            categoryDemandData,
            circleUserLimits: groupUserLimits, // Keep key name for backward compatibility
            userEngagement,
        });
    } catch (error) {
        console.error('Error fetching circle analytics:', error);
        if (error.message && (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND'))) {
            return NextResponse.json({
                circles: [],
                useCircles: true,
                groupingKey: 'circle',
                categoryDemandData: [],
                circleUserLimits: [],
                userEngagement: [],
                warning: 'offline_mode'
            }, { status: 200 });
        }
        return NextResponse.json({
            error: error.message,
            circles: [],
            categoryDemandData: [],
            circleUserLimits: [],
            userEngagement: [],
        }, { status: 500 });
    }
}
