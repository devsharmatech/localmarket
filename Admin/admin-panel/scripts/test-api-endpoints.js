/**
 * Test script to verify all API endpoints are working with the database
 * Run with: node scripts/test-api-endpoints.js
 */

const API_BASE = 'http://localhost:3000/api';

const endpoints = [
    // Dashboard & Reports
    { path: '/reports/dashboard', method: 'GET', name: 'Dashboard' },
    { path: '/reports/search', method: 'GET', name: 'Search Reports' },
    { path: '/reports/vendor-activity', method: 'GET', name: 'Vendor Activity' },

    // Analytics
    { path: '/analytics/circle', method: 'GET', name: 'Circle Analytics' },

    // Core Data
    { path: '/users', method: 'GET', name: 'Users' },
    { path: '/vendors', method: 'GET', name: 'Vendors' },
    { path: '/categories', method: 'GET', name: 'Categories' },
    { path: '/master-products', method: 'GET', name: 'Master Products' },
    { path: '/locations', method: 'GET', name: 'Locations' },

    // Settings & Config
    { path: '/themes', method: 'GET', name: 'Themes' },
    { path: '/price-verification/settings', method: 'GET', name: 'Price Verification Settings' },
    { path: '/payment-fees/config', method: 'GET', name: 'Payment Fees Config' },
    { path: '/banners', method: 'GET', name: 'Banners' },
    { path: '/notifications', method: 'GET', name: 'Notifications' },
];

async function testEndpoint(endpoint) {
    try {
        const url = `${API_BASE}${endpoint.path}`;
        console.log(`\n🔍 Testing: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);

        const response = await fetch(url, {
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
            const dataType = Array.isArray(data) ? 'array' : typeof data;
            const dataLength = Array.isArray(data) ? data.length : Object.keys(data).length;

            console.log(`  ✅ Success (${response.status})`);
            console.log(`  📊 Response type: ${dataType}`);
            if (Array.isArray(data)) {
                console.log(`  📈 Items: ${dataLength}`);
            } else if (dataLength > 0) {
                console.log(`  📈 Keys: ${Object.keys(data).join(', ')}`);
            }

            return { success: true, status: response.status, data };
        } else {
            console.log(`  ❌ Failed (${response.status})`);
            console.log(`  ⚠️  Error: ${data.error || 'Unknown error'}`);
            return { success: false, status: response.status, error: data.error };
        }
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('🚀 Starting API Endpoint Tests...');
    console.log(`📍 Base URL: ${API_BASE}`);
    console.log('='.repeat(60));

    const results = {
        passed: [],
        failed: [],
        warnings: [],
    };

    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);

        if (result.success) {
            results.passed.push(endpoint.name);
        } else {
            // Check if it's a missing table error (which is OK for some endpoints)
            if (result.error && (
                result.error.includes('does not exist') ||
                result.error.includes('relation') ||
                result.error.includes('PGRST205')
            )) {
                results.warnings.push(`${endpoint.name}: Table may not exist`);
            } else {
                results.failed.push(endpoint.name);
            }
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed.length}/${endpoints.length}`);
    console.log(`❌ Failed: ${results.failed.length}/${endpoints.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}/${endpoints.length}`);

    if (results.passed.length > 0) {
        console.log('\n✅ Working Endpoints:');
        results.passed.forEach(name => console.log(`   - ${name}`));
    }

    if (results.failed.length > 0) {
        console.log('\n❌ Failed Endpoints:');
        results.failed.forEach(name => console.log(`   - ${name}`));
    }

    if (results.warnings.length > 0) {
        console.log('\n⚠️  Warnings (Tables may need to be created):');
        results.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    console.log('\n💡 Tip: Run the SQL scripts in the sql/ folder to create missing tables');
}

// Run tests
runTests().catch(console.error);
