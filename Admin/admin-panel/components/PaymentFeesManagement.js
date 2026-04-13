'use client';

import { useState, useEffect, useRef } from 'react';

export default function PaymentFeesManagement() {
  const [feesConfig, setFeesConfig] = useState({
    monthly: 50,
    sixMonthly: 299,
    yearly: 599,
    gracePeriod: 7,
    autoBlockEnabled: true,
  });

  const [bannerConfig, setBannerConfig] = useState({
    enabled: true,
    badge: '🚀 Registration Offer',
    title: 'Activate Your Vendor Account',
    subtitle: 'Choose a subscription plan to start selling on Local Market and reach thousands of customers in your area.',
    imageUrl: '',
  });
  const [bannerImagePreview, setBannerImagePreview] = useState('');
  const [savingBanner, setSavingBanner] = useState(false);
  const bannerFileRef = useRef(null);

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const showStatus = (text, type = 'success') => {
    if (statusMessage) return; // Prevent stacking
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  useEffect(() => {
    loadConfig();
    loadVendors();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/payment-fees/config');
      if (res.ok) {
        const config = await res.json();
        setFeesConfig({
          monthly: config.monthly_fee || 50,
          sixMonthly: config.six_monthly_fee || 299,
          yearly: config.yearly_fee || 599,
          gracePeriod: config.grace_period_days || 7,
          autoBlockEnabled: config.auto_block_enabled !== false,
        });
        setBannerConfig({
          enabled: config.banner_enabled !== false,
          badge: config.banner_badge || '🚀 Registration Offer',
          title: config.banner_title || 'Activate Your Vendor Account',
          subtitle: config.banner_subtitle || 'Choose a subscription plan to start selling on Local Market and reach thousands of customers in your area.',
          imageUrl: config.banner_image_url || '',
        });
        setBannerImagePreview(config.banner_image_url || '');
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const loadVendors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payment-fees/vendors');
      if (res.ok) {
        const billing = await res.json();
        setVendors(billing.map(b => ({
          id: b.id,
          vendorId: b.vendor_id || 'N/A',
          name: b.vendors?.name || 'Unknown',
          phone: b.vendors?.contact_number || 'N/A',
          location: b.vendors?.city ? `${b.vendors.city}${b.vendors.state ? `, ${b.vendors.state}` : ''}` : 'N/A',
          category: b.vendors?.category || 'General',
          plan: b.plan,
          status: b.status,
          dueDate: b.due_date,
          amount: parseFloat(b.amount),
          razorpayId: b.razorpay_payment_id || 'N/A',
        })));
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFees = (plan, value) => {
    setFeesConfig(prev => ({
      ...prev,
      [plan]: parseFloat(value) || 0,
    }));
  };

  const handleSaveConfig = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      setSaving(true);
      const res = await fetch('/api/payment-fees/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthly_fee: feesConfig.monthly,
          six_monthly_fee: feesConfig.sixMonthly,
          yearly_fee: feesConfig.yearly,
          grace_period_days: feesConfig.gracePeriod,
          auto_block_enabled: feesConfig.autoBlockEnabled,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showStatus('Configuration saved successfully!');
      } else {
        const errorMessage = data.error || `Error (${res.status})`;
        showStatus(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      showStatus(error.message || 'Error saving configuration', 'error');
    } finally {
      setSaving(false);
      setProcessing(false);
    }
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showStatus('Please select an image file', 'error'); return; }
    if (file.size > 4.5 * 1024 * 1024) { showStatus('Image size should be less than 4.5MB', 'error'); return; }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'general');
      formData.append('folder', 'subscription-banner');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok || !data.url) {
        showStatus(data.error || 'Upload failed', 'error');
        return;
      }

      setBannerConfig(prev => ({ ...prev, imageUrl: data.url }));
      setBannerImagePreview(data.url);
    } catch (err) {
      showStatus(err.message || 'Upload failed', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleResetBanner = async () => {
    if (processing) return;
    setProcessing(true);
    if (!confirm('Are you sure you want to reset the banner to default settings? This will clear your custom title, subtitle, and image.')) {
      setProcessing(false);
      return;
    }
    try {
      setSavingBanner(true);
      // Don't clear preview immediately; wait for API to ensure it's removed

      const res = await fetch('/api/payment-fees/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banner_enabled: true,
          banner_badge: '🚀 Registration Offer',
          banner_title: 'Activate Your Vendor Account',
          banner_subtitle: 'Choose a subscription plan to start selling on Local Market and reach thousands of customers in your area.',
          banner_image_url: null,
        }),
      });
      if (res.ok) {
        // Now clear local UI and reload truth from DB
        setBannerImagePreview('');
        if (bannerFileRef.current) bannerFileRef.current.value = '';
        await loadConfig();
        showStatus('Banner reset to defaults successfully');
      } else {
        showStatus('Failed to reset banner', 'error');
      }
    } catch (e) {
      showStatus('Error resetting banner', 'error');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleSaveBanner = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      setSavingBanner(true);
      const res = await fetch('/api/payment-fees/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banner_enabled: bannerConfig.enabled,
          banner_badge: bannerConfig.badge,
          banner_title: bannerConfig.title,
          banner_subtitle: bannerConfig.subtitle,
          banner_image_url: bannerConfig.imageUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showStatus('Subscription banner saved successfully!');
      } else {
        showStatus(data.error || 'Failed to save banner', 'error');
      }
    } catch (error) {
      showStatus(error.message || 'Error saving banner', 'error');
    } finally {
      setSavingBanner(false);
      setProcessing(false);
    }
  };

  const handleBlockVendor = async (vendorId) => {
    if (processing) return;
    setProcessing(true);
    try {
      const vendor = vendors.find(v => v.id === vendorId);
      if (!vendor) return;

      const res = await fetch('/api/payment-fees/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendor.vendorId,
          status: 'blocked',
        }),
      });

      if (res.ok) {
        await loadVendors();
        showStatus('Vendor blocked successfully');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showStatus(errorData.error || 'Failed to block vendor', 'error');
      }
    } catch (error) {
      console.error('Error blocking vendor:', error);
      showStatus('Failed to block vendor', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleActivateVendor = async (vendorId) => {
    if (processing) return;
    setProcessing(true);
    try {
      const vendor = vendors.find(v => v.id === vendorId);
      if (!vendor) return;

      const nextDueDate = calculateNextDueDate(new Date(), vendor.plan);

      const res = await fetch('/api/payment-fees/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendor.vendorId,
          status: 'paid',
          plan: vendor.plan,
          amount: feesConfig[vendor.plan === 'monthly' ? 'monthly' : vendor.plan === 'six_monthly' ? 'sixMonthly' : 'yearly'],
          due_date: nextDueDate,
        }),
      });

      if (res.ok) {
        await loadVendors();
        showStatus('Vendor activated successfully');
      } else {
        const errorData = await res.json().catch(() => ({}));
        showStatus(errorData.error || 'Failed to activate vendor', 'error');
      }
    } catch (error) {
      console.error('Error activating vendor:', error);
      showStatus('Failed to activate vendor', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const calculateNextDueDate = (currentDate, plan) => {
    const date = new Date(currentDate);
    if (plan === 'monthly') date.setMonth(date.getMonth() + 1);
    else if (plan === 'six_monthly') date.setMonth(date.getMonth() + 6);
    else if (plan === 'yearly') date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment & Fees Management</h1>
      
      {/* Global Status Message */}
      {statusMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border animate-in fade-in slide-in-from-top-4 duration-300 ${
          statusMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{statusMessage.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium">{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Fees Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Association Fees Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Fee (₹)</label>
            <input
              type="number"
              value={feesConfig.monthly}
              onChange={(e) => handleUpdateFees('monthly', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Six-Monthly Fee (₹)</label>
            <input
              type="number"
              value={feesConfig.sixMonthly}
              onChange={(e) => handleUpdateFees('sixMonthly', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Yearly Fee (₹)</label>
            <input
              type="number"
              value={feesConfig.yearly}
              onChange={(e) => handleUpdateFees('yearly', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={feesConfig.autoBlockEnabled}
              onChange={(e) => setFeesConfig(prev => ({ ...prev, autoBlockEnabled: e.target.checked }))}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Enable Auto-Block for Non-Payment</span>
          </label>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Grace Period (days):</label>
            <input
              type="number"
              value={feesConfig.gracePeriod}
              onChange={(e) => setFeesConfig(prev => ({ ...prev, gracePeriod: parseInt(e.target.value) || 0 }))}
              className="w-20 px-2 py-1 border border-gray-300 rounded"
            />
          </div>
        </div>
        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="mt-4 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Subscription Banner Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">📢</span>
          <h2 className="text-xl font-semibold">Subscription Banner</h2>
          <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold" style={{
            background: bannerConfig.enabled ? '#dcfce7' : '#fee2e2',
            color: bannerConfig.enabled ? '#16a34a' : '#dc2626'
          }}>
            {bannerConfig.enabled ? 'ACTIVE' : 'HIDDEN'}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-5">This banner appears above the plan selection cards on the vendor registration payment page.</p>

        {/* Live Preview */}
        {bannerConfig.enabled && (
          <div className="mb-6 p-5 rounded-xl border border-orange-200" style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#9a3412', letterSpacing: '0.05em' }}>PREVIEW</p>
            {bannerImagePreview && (
              <img src={bannerImagePreview} alt="Banner" className="w-full h-32 object-cover rounded-lg mb-3" />
            )}
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2" style={{ background: 'linear-gradient(90deg, #f97316, #ef4444)', color: '#fff' }}>
              {bannerConfig.badge || '🚀 Registration Offer'}
            </span>
            <h3 className="text-lg font-extrabold text-gray-900 mb-1">{bannerConfig.title || 'Activate Your Vendor Account'}</h3>
            <p className="text-sm text-gray-600">{bannerConfig.subtitle}</p>
          </div>
        )}
        {!bannerConfig.enabled && (
          <div className="mb-6 p-4 rounded-xl border border-dashed border-gray-300 text-center text-gray-400 text-sm">
            Banner is currently hidden from the payment page.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
            <input
              type="text"
              value={bannerConfig.badge}
              onChange={(e) => setBannerConfig(prev => ({ ...prev, badge: e.target.value }))}
              placeholder="e.g. 🚀 Registration Offer"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Title</label>
            <input
              type="text"
              value={bannerConfig.title}
              onChange={(e) => setBannerConfig(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Activate Your Vendor Account"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Subtitle / Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              rows={2}
              value={bannerConfig.subtitle}
              onChange={(e) => setBannerConfig(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Describe Subscription benefits or a promotional note..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
            />
          </div>
          {/* Optional Image Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={bannerFileRef}
                type="file"
                accept="image/*"
                onChange={handleBannerImageUpload}
                className="hidden"
                id="sub-banner-image-upload"
              />
              <label
                htmlFor="sub-banner-image-upload"
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition text-sm font-medium"
              >
                📸 Upload Image
              </label>
              <span className="text-xs text-gray-400">or</span>
              <input
                type="url"
                value={(bannerConfig.imageUrl || '').startsWith('data:') ? '' : (bannerConfig.imageUrl || '')}
                onChange={(e) => {
                  setBannerConfig(prev => ({ ...prev, imageUrl: e.target.value }));
                  setBannerImagePreview(e.target.value);
                }}
                className="flex-1 min-w-[180px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                placeholder="Paste image URL..."
              />
              {bannerImagePreview && (
                <button
                  type="button"
                  onClick={() => { setBannerConfig(prev => ({ ...prev, imageUrl: '' })); setBannerImagePreview(''); if (bannerFileRef.current) bannerFileRef.current.value = ''; }}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  Remove
                </button>
              )}
            </div>
            {bannerImagePreview && (
              <img src={bannerImagePreview} alt="Preview" className="mt-3 h-28 w-full object-cover rounded-lg border border-gray-200" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setBannerConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                bannerConfig.enabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                bannerConfig.enabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {bannerConfig.enabled ? 'Banner is visible on payment page' : 'Banner is hidden from payment page'}
            </span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetBanner}
              disabled={savingBanner}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 text-sm font-medium border border-red-200"
            >
              🗑️ Delete/Reset
            </button>
            <button
              onClick={handleSaveBanner}
              disabled={savingBanner}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 text-sm font-semibold shadow-md"
            >
              {savingBanner ? 'Saving...' : 'Save Banner'}
            </button>
          </div>
        </div>
      </div>

      {/* Vendor Payment Status */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Vendor Payment Status</h2>
          <button
            onClick={loadVendors}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading vendor billing...</div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No vendor billing records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Vendor Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact / Loc</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Plan</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Due Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{vendor.vendorId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-700">{vendor.phone}</div>
                      <div className="text-xs text-gray-400">{vendor.location}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{vendor.category}</td>
                    <td className="py-3 px-4 text-sm text-gray-700 capitalize">{vendor.plan}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(vendor.status)}`}>
                        {vendor.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{vendor.dueDate}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 font-bold">₹{vendor.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {vendor.status !== 'paid' && (
                          <button
                            onClick={() => handleActivateVendor(vendor.id)}
                            className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-md hover:bg-green-600 transition"
                          >
                            Activate
                          </button>
                        )}
                        {vendor.status !== 'blocked' && (
                          <button
                            onClick={() => handleBlockVendor(vendor.id)}
                            className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-md hover:bg-red-200 transition border border-red-200"
                          >
                            Block
                          </button>
                        )}
                      </div>
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
