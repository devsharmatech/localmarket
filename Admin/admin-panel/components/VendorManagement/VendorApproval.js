'use client';

import { useEffect, useState } from 'react';

export default function VendorApproval({ onViewProfile }) {
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/vendors/pending', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error || 'Failed to load pending vendors');
        } else if (!cancelled) {
          setPendingVendors(Array.isArray(data?.vendors) ? data.vendors : []);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load pending vendors');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const updateVendor = async (vendorId, patch) => {
    const res = await fetch('/api/vendors/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vendorId, ...patch }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.error || 'Failed to update vendor');
      return null;
    }
    return data.vendor;
  };

  const handleApprove = async (vendorId) => {
    try {
      await updateVendor(vendorId, { status: 'Active', kycStatus: 'Verified' });
      setPendingVendors(prev => prev.filter(v => v.id !== vendorId));
      setSelectedVendor(null);
    } catch (e) {
      setError(e?.message || 'Failed to approve vendor');
    }
  };

  const handleReject = async (vendorId) => {
    try {
      await updateVendor(vendorId, { status: 'Blocked', kycStatus: 'Rejected' });
      setPendingVendors(prev => prev.filter(v => v.id !== vendorId));
      setSelectedVendor(null);
    } catch (e) {
      setError(e?.message || 'Failed to reject vendor');
    }
  };

  const handleHold = async (vendorId) => {
    try {
      await updateVendor(vendorId, { status: 'Pending', kycStatus: 'Pending' });
      setSelectedVendor(null);
    } catch (e) {
      setError(e?.message || 'Failed to put vendor on hold');
    }
  };

  if (selectedVendor) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <button
          onClick={() => setSelectedVendor(null)}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          ← Back to List
        </button>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedVendor.name}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Owner Name</label>
                <p className="text-gray-900">{selectedVendor.owner}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{selectedVendor.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{selectedVendor.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Location</label>
                <p className="text-gray-900">
                  {[selectedVendor.city, selectedVendor.state].filter(Boolean).join(', ') || '—'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">KYC Documents</h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
              KYC Status: <span className="font-semibold">{selectedVendor.kyc_status || selectedVendor.kycStatus || 'Pending'}</span>
              <div className="text-xs text-gray-500 mt-1">
                (Document-level KYC fields can be added later when you store documents in DB)
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleApprove(selectedVendor.id)}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Approve
            </button>
            <button
              onClick={() => handleHold(selectedVendor.id)}
              className="flex-1 bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700 transition"
            >
              Put on Hold
            </button>
            <button
              onClick={() => handleReject(selectedVendor.id)}
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="font-semibold">Vendor approval API error</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Approvals</h2>
        {loading && <div className="text-sm text-gray-600 mb-4">Loading…</div>}
        <div className="space-y-4">
          {pendingVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
                  <p className="text-sm text-gray-600">
                    {vendor.owner} • {[vendor.city, vendor.state].filter(Boolean).join(', ') || '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted: {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString('en-IN') : '—'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVendor(vendor)}
                  className="gradient-primary text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition"
                >
                  Review KYC
                </button>
              </div>
            </div>
          ))}
          {!loading && pendingVendors.length === 0 && (
            <div className="text-sm text-gray-600">No pending vendors.</div>
          )}
        </div>
      </div>
    </div>
  );
}



