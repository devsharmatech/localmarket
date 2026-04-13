import { NextResponse } from 'next/server';
import { supabaseRestGet } from '@/lib/supabaseAdminFetch';

// GET /api/reports/vendor-activity - Get vendor activity reports
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sortBy = searchParams.get('sortBy') || 'views';

        // Get all vendors
        let vendors = [];
        try {
            vendors = await supabaseRestGet('/rest/v1/vendors?select=id,name,status,created_at');
            vendors = Array.isArray(vendors) ? vendors : [];
        } catch (e) {
            console.error('Error fetching vendors:', e.message);
            vendors = [];
        }

        // Get activity logs
        let activityLogs = [];
        try {
            activityLogs = await supabaseRestGet('/rest/v1/vendor_activity_logs?select=vendor_id,activity_type,created_at');
            activityLogs = Array.isArray(activityLogs) ? activityLogs : [];
        } catch (e) {
            console.warn('vendor_activity_logs table may not exist or is empty:', e.message);
            activityLogs = [];
        }

        // Calculate metrics per vendor
        const vendorMetrics = vendors.map(vendor => {
            const vendorActivities = activityLogs.filter(log => log.vendor_id === vendor.id);

            const priceUpdates = vendorActivities.filter(a => a.activity_type === 'price_update').length;
            const views = vendorActivities.filter(a => a.activity_type === 'profile_viewed').length;

            // Get last activity
            const lastActivity = vendorActivities.length > 0
                ? vendorActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at
                : vendor.created_at;

            // Calculate completeness (simplified - you may want to enhance this)
            const products = vendorActivities.filter(a => a.activity_type === 'product_added').length;
            const completeness = Math.min(100, (products / 10) * 100); // Assuming 10 products = 100%

            return {
                id: vendor.id,
                name: vendor.name,
                status: vendor.status === 'Active' ? 'Active' : 'Inactive',
                priceUpdates,
                viewCount: views,
                completeness: Math.round(completeness),
                lastActive: lastActivity,
            };
        });

        // Sort
        if (sortBy === 'views') {
            vendorMetrics.sort((a, b) => b.viewCount - a.viewCount);
        } else if (sortBy === 'updates') {
            vendorMetrics.sort((a, b) => b.priceUpdates - a.priceUpdates);
        } else if (sortBy === 'completeness') {
            vendorMetrics.sort((a, b) => b.completeness - a.completeness);
        }

        // Get active vs inactive counts
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activeVendors = vendorMetrics.filter(v => {
            const lastActive = new Date(v.lastActive);
            return lastActive >= sevenDaysAgo && v.status === 'Active';
        }).length;

        const inactiveVendors = vendorMetrics.filter(v => {
            const lastActive = new Date(v.lastActive);
            return lastActive < sevenDaysAgo || v.status !== 'Active';
        }).length;

        return NextResponse.json({
            vendors: vendorMetrics,
            activeVendors,
            inactiveVendors,
        });
    } catch (error) {
        console.error('Error fetching vendor activity reports:', error);
        // Return empty data instead of error to allow UI to load
        return NextResponse.json({
            vendors: [],
            activeVendors: 0,
            inactiveVendors: 0,
        }, { status: 200 });
    }
}
