'use client';

import { useState, useEffect, useCallback } from 'react';

const STATUS_OPTIONS = ['Pending', 'Active', 'Blocked'];
const KYC_OPTIONS = ['Pending', 'Submitted', 'Approved', 'Rejected'];

const statusColors = {
  Active: 'bg-green-100 text-green-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Blocked: 'bg-red-100 text-red-800',
};
const kycColors = {
  Approved: 'bg-green-100 text-green-800',
  Submitted: 'bg-blue-100 text-blue-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Rejected: 'bg-red-100 text-red-800',
};

export default function VendorProfile({ vendor: initialVendor, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [vendor, setVendor] = useState(initialVendor);
  const [products, setProducts] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [updatingField, setUpdatingField] = useState(null); // 'status' | 'kyc' | 'block'
  const [updatingProductFlag, setUpdatingProductFlag] = useState(null);
  
  // Location Lookup State
  const [cities, setCities] = useState([]);
  const [availableCircles, setAvailableCircles] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedCity, setSelectedCity] = useState(initialVendor?.city || '');

  // Simple SVG Icons
  const Icons = {
    Star: ({ filled }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    ),
    TrendDown: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
    ),
    Zap: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    )
  };

  // Fetch live vendor data from DB
  const fetchVendorData = useCallback(async () => {
    if (!initialVendor?.id) return;
    setLoadingData(true);
    try {
      const res = await fetch(
        `/api/vendors/${initialVendor.id}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.vendor) setVendor(prev => ({ ...prev, ...data.vendor }));
        setProducts(Array.isArray(data.products) ? data.products : []);
        setEnquiries(Array.isArray(data.enquiries) ? data.enquiries : []);
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      }
    } catch (e) {
      console.error('Failed to fetch vendor data:', e);
    }
    setLoadingData(false);
  }, [initialVendor?.id]);

  useEffect(() => { fetchVendorData(); }, [fetchVendorData]);

  // Load cities on mount
  useEffect(() => {
    fetch('/api/locations?limit=1000')
      .then(res => res.json())
      .then(data => {
        if (data.locations) {
          const uniqueCities = Array.from(new Set(data.locations.map(l => l.city))).sort();
          setCities(uniqueCities);
        }
      })
      .catch(err => console.error('Failed to load cities:', err));
  }, []);

  // Fetch circles when city changes
  useEffect(() => {
    if (!selectedCity) {
      setAvailableCircles([]);
      return;
    }
    setLoadingLocations(true);
    fetch(`/api/locations?city=${encodeURIComponent(selectedCity)}&limit=1000`)
      .then(res => res.json())
      .then(data => {
        if (data.locations) {
          const circles = Array.from(new Set(data.locations.filter(l => l.circle).map(l => l.circle))).sort();
          setAvailableCircles(circles);
        }
      })
      .catch(err => console.error('Failed to load circles:', err))
      .finally(() => setLoadingLocations(false));
  }, [selectedCity]);

  // Patch vendor status or kycStatus
  const patchVendor = async (payload, field) => {
    setUpdatingField(field);
    try {
      const res = await fetch('/api/vendors/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vendor.id, ...payload }),
      });
      const data = await res.json();
      if (res.ok && data.vendor) {
        setVendor(prev => ({
          ...prev,
          ...data.vendor,
          // Handle potential snake_case to camelCase mapping
          kycStatus: data.vendor.kyc_status ?? data.vendor.kycStatus ?? prev.kycStatus,
          idProofUrl: data.vendor.id_proof_url ?? data.vendor.idProofUrl ?? prev.idProofUrl,
          shopProofUrl: data.vendor.shop_proof_url ?? data.vendor.shopProofUrl ?? prev.shopProofUrl,
          shopFrontPhotoUrl: data.vendor.shop_front_photo_url ?? data.vendor.shopFrontPhotoUrl ?? prev.shopFrontPhotoUrl,
        }));
      }
    } catch (e) {
      console.error('Patch failed:', e);
    }
    setUpdatingField(null);
  };

  const handleDocumentUpdate = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUpdatingField(field);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'vendor-documents');
      formData.append('folder', field === 'shop_proof_url' ? 'kyc-documents' : field === 'id_proof_url' ? 'id-proofs' : 'shop-photos');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.url) {
        const urlField = field === 'id_proof_url' ? 'idProofUrl' : field === 'shop_proof_url' ? 'shopProofUrl' : 'shopFrontPhotoUrl';
        await patchVendor({ [field]: data.url }, urlField);
        alert('Document updated successfully');
      } else {
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Document update failed:', e);
      alert('Error updating document');
    }
    setUpdatingField(null);
  };

  // Average rating from real reviews
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
    : (vendor.rating ?? 0).toFixed(1);

  // Patch a specific product
  const patchProduct = async (productId, payload) => {
    try {
      const res = await fetch(`/api/vendor-products?id=${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...payload } : p));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update product');
      }
    } catch (e) {
      console.error('Product patch failed:', e);
      alert('Network error while updating product');
    }
  };

  const toggleProductFlag = async (productId, field, currentValue) => {
    try {
      setUpdatingProductFlag(productId);
      const res = await fetch('/api/featured', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productId,
          type: 'products',
          field,
          value: !currentValue
        })
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, [field]: !currentValue } : p
        ));
      }
    } catch (e) {
      console.error('Product flag toggle error:', e);
    } finally {
      setUpdatingProductFlag(null);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: `Products (${products.length})` },
    { id: 'enquiries', label: `Enquiries (${enquiries.length})` },
    { id: 'reviews', label: `Reviews (${reviews.length})` },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <button onClick={onBack} className="mb-5 text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm">
        ← Back to Vendor List
      </button>

      {/* ── Vendor Header Card ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{vendor.name}</h1>
            <p className="text-gray-500 text-sm">Owner: {vendor.ownerName ?? vendor.owner ?? '—'}</p>
            <p className="text-gray-400 text-xs mt-0.5">{vendor.category} · {vendor.city} {vendor.circle ? `· ${vendor.circle}` : ''}</p>
          </div>
          {/* Activation Status Dropdown */}
          <div className="flex flex-col items-end gap-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Activation Status</label>
            <div className="relative">
              <select
                value={vendor.status ?? 'Pending'}
                disabled={updatingField === 'status'}
                onChange={e => patchVendor({ status: e.target.value }, 'status')}
                className={`appearance-none pr-8 pl-3 py-1.5 rounded-lg text-sm font-semibold border cursor-pointer focus:outline-none ${statusColors[vendor.status] ?? 'bg-gray-100 text-gray-700'}`}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {updatingField === 'status' && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs">⏳</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {/* KYC Status Dropdown */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">KYC Status</label>
            <select
              value={vendor.kycStatus ?? 'Pending'}
              disabled={updatingField === 'kyc'}
              onChange={e => patchVendor({ kycStatus: e.target.value }, 'kyc')}
              className={`appearance-none w-full px-3 py-1.5 rounded-lg text-sm font-semibold border cursor-pointer focus:outline-none ${kycColors[vendor.kycStatus] ?? 'bg-gray-100 text-gray-700'}`}
            >
              {KYC_OPTIONS.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Products</label>
            <p className="text-sm font-bold text-gray-900">{products.length}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Reviews</label>
            <p className="text-sm font-bold text-gray-900">{reviews.length} ({avgRating}★)</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Enquiries</label>
            <p className="text-sm font-bold text-gray-900">{enquiries.length}</p>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Address</label>
            <p className="text-sm text-gray-700">{[vendor.address, vendor.city, vendor.pincode].filter(Boolean).join(', ') || '—'}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Phone</label>
            <p className="text-sm text-gray-700">{vendor.phone ?? vendor.contactNumber ?? '—'}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Email</label>
            <p className="text-sm text-gray-700">{vendor.email || '—'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
          {vendor.status !== 'Blocked' ? (
            <button
              onClick={() => patchVendor({ status: 'Blocked' }, 'block')}
              disabled={!!updatingField}
              className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
            >
              {updatingField === 'block' ? 'Blocking…' : 'Block Vendor'}
            </button>
          ) : (
            <button
              onClick={() => patchVendor({ status: 'Active' }, 'block')}
              disabled={!!updatingField}
              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {updatingField === 'block' ? 'Unblocking…' : 'Unblock Vendor'}
            </button>
          )}
          {vendor.status === 'Pending' && (
            <button
              onClick={() => patchVendor({ status: 'Active' }, 'block')}
              disabled={!!updatingField}
              className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              Approve & Activate
            </button>
          )}
          {vendor.phone && (
            <a
              href={`tel:${vendor.phone}`}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
            >
              Call Vendor
            </a>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Products Listed', value: products.length },
              { label: 'Enquiries Received', value: enquiries.length },
              { label: 'Total Reviews', value: reviews.length },
              { label: 'Avg Rating', value: `${avgRating} ★` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>

          {/* Registration Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-3">Registration Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-400">Display ID</span><p className="font-mono font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-sm mt-0.5 inline-block">{vendor.displayId || vendor.display_id || '—'}</p></div>
              <div><span className="text-gray-400">System ID</span><p className="font-mono font-medium text-gray-800 text-[10px] mt-0.5 truncate max-w-[120px]" title={vendor.id}>{vendor.id}</p></div>
              <div><span className="text-gray-400">Registered</span><p className="font-medium text-gray-800 mt-0.5">{vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString('en-IN') : '—'}</p></div>
              <div><span className="text-gray-400">Category</span><p className="font-medium text-gray-800 mt-0.5">{vendor.category || '—'}</p></div>
              <div className="flex flex-col col-span-2">
                <span className="text-gray-400">Target Location (City &gt; Market)</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      setSelectedCity(newCity);
                      patchVendor({ city: newCity, circle: '' }, 'city');
                    }}
                    className="text-xs font-medium text-gray-800 bg-gray-100 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Select City</option>
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    value={vendor.circle || ''}
                    disabled={!selectedCity || loadingLocations}
                    onChange={(e) => {
                      patchVendor({ circle: e.target.value }, 'circle');
                    }}
                    className="text-xs font-medium text-gray-800 bg-gray-100 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
                  >
                    <option value="">{selectedCity ? 'All Markets in' : 'Select City First'}</option>
                    {availableCircles.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-4">KYC Documents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Proof */}
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">ID Proof</span>
                {vendor.idProofUrl ? (
                  <div className="relative group">
                    {vendor.idProofUrl.toLowerCase().endsWith('.pdf') ? (
                      <a
                        href={vendor.idProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                      >
                        <span className="text-2xl">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">View ID Proof (PDF)</p>
                          <p className="text-xs text-gray-500">Click to open in new tab</p>
                        </div>
                      </a>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={vendor.idProofUrl}
                          alt="ID Proof"
                          className="w-full h-48 object-contain cursor-pointer"
                          onClick={() => window.open(vendor.idProofUrl, '_blank')}
                        />
                        <div className="p-2 border-t border-gray-200 text-center">
                          <button
                            onClick={() => window.open(vendor.idProofUrl, '_blank')}
                            className="text-xs font-bold text-orange-600 hover:text-orange-700"
                          >
                            View Full Image
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-400">
                    <span className="text-2xl mb-1">📋</span>
                    <p className="text-xs font-medium">No ID proof uploaded</p>
                  </div>
                )}
                <div className="mt-3">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                    <span>{updatingField === 'id_proof_url' ? 'Uploading…' : 'Update ID Proof'}</span>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={e => handleDocumentUpdate(e, 'id_proof_url')} disabled={!!updatingField} />
                  </label>
                </div>
              </div>

              {/* Business Photo / Shop Front */}
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Business Photo</span>
                {vendor.shopFrontPhotoUrl || vendor.imageUrl ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src={vendor.shopFrontPhotoUrl || vendor.imageUrl}
                      alt="Business Photo"
                      className="w-full h-48 object-cover cursor-pointer"
                      onClick={() => window.open(vendor.shopFrontPhotoUrl || vendor.imageUrl, '_blank')}
                    />
                    <div className="p-2 border-t border-gray-200 text-center">
                      <button
                        onClick={() => window.open(vendor.shopFrontPhotoUrl || vendor.imageUrl, '_blank')}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700"
                      >
                        View Full Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-400">
                    <span className="text-2xl mb-1">📸</span>
                    <p className="text-xs font-medium">No business photo uploaded</p>
                  </div>
                )}
                <div className="mt-3">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                    <span>{updatingField === 'shop_front_photo_url' ? 'Uploading…' : 'Update Photo'}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={e => handleDocumentUpdate(e, 'shop_front_photo_url')} disabled={!!updatingField} />
                  </label>
                </div>
              </div>

              {/* Shop Document / KYC */}
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Shop Document (KYC)</span>
                {vendor.shopProofUrl ? (
                  <div className="relative group">
                    {vendor.shopProofUrl.toLowerCase().endsWith('.pdf') ? (
                      <a
                        href={vendor.shopProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                      >
                        <span className="text-2xl">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">View Shop Document (PDF)</p>
                          <p className="text-xs text-gray-500">Click to open in new tab</p>
                        </div>
                      </a>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={vendor.shopProofUrl}
                          alt="Shop Proof"
                          className="w-full h-48 object-contain cursor-pointer"
                          onClick={() => window.open(vendor.shopProofUrl, '_blank')}
                        />
                        <div className="p-2 border-t border-gray-200 text-center">
                          <button
                            onClick={() => window.open(vendor.shopProofUrl, '_blank')}
                            className="text-xs font-bold text-orange-600 hover:text-orange-700"
                          >
                            View Full Document
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-400">
                    <span className="text-2xl mb-1">📁</span>
                    <p className="text-xs font-medium">No shop proof uploaded</p>
                  </div>
                )}
                <div className="mt-3">
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                    <span>{updatingField === 'shopProofUrl' || updatingField === 'shop_proof_url' ? 'Uploading…' : 'Update Document'}</span>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={e => handleDocumentUpdate(e, 'shop_proof_url')} disabled={!!updatingField} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Products Tab ── */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loadingData ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : products.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-gray-400 font-medium">No products listed yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Category', 'Price', 'MRP', 'Online Price', 'Promote', 'Stock'].map(h => (
                    <th key={h} className={`text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider ${h === 'Promote' ? 'text-center' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{p.name ?? p.product_name}</td>
                    <td className="py-3 px-4 text-gray-500">{p.category ?? '—'}</td>
                    <td className="py-3 px-4 text-green-700 font-semibold">₹{p.price ?? p.selling_price ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-400 line-through">₹{p.mrp ?? '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title="Feature in Deals"
                          disabled={updatingProductFlag === p.id}
                          onClick={() => toggleProductFlag(p.id, 'is_featured', p.is_featured)}
                          className={`p-1.5 rounded-lg transition-all ${p.is_featured ? 'bg-amber-100 text-amber-600' : 'text-gray-300 hover:text-gray-400'}`}
                        >
                          <Icons.Star filled={p.is_featured} />
                        </button>
                        <button
                          title="Mark as Price Drop"
                          disabled={updatingProductFlag === p.id}
                          onClick={() => toggleProductFlag(p.id, 'is_price_drop', p.is_price_drop)}
                          className={`p-1.5 rounded-lg transition-all ${p.is_price_drop ? 'bg-red-100 text-red-600' : 'text-gray-300 hover:text-gray-400'}`}
                        >
                          <Icons.TrendDown />
                        </button>
                        <button
                          title="Mark as Mega Saving"
                          disabled={updatingProductFlag === p.id}
                          onClick={() => toggleProductFlag(p.id, 'is_mega_saving', p.is_mega_saving)}
                          className={`p-1.5 rounded-lg transition-all ${p.is_mega_saving ? 'bg-green-100 text-green-600' : 'text-gray-300 hover:text-gray-400'}`}
                        >
                          <Icons.Zap />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{p.stock_qty ?? p.quantity ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Enquiries Tab ── */}
      {activeTab === 'enquiries' && (
        <div className="space-y-3">
          {loadingData ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : enquiries.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-gray-400 font-medium">No enquiries yet</p>
            </div>
          ) : (
            enquiries.map(e => {
              const name = e.senderName ?? e.customer_name ?? e.name ?? 'Customer';
              const phone = e.senderPhone ?? e.customer_phone ?? e.phone ?? e.senderMobile ?? '';
              const msg = e.message ?? e.service ?? '';
              const date = e.created_at ? new Date(e.created_at).toLocaleDateString('en-IN') : '';
              return (
                <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-gray-900">{name}</p>
                    <span className="text-xs text-gray-400">{date}</span>
                  </div>
                  {phone && <p className="text-xs text-gray-500 mb-2">📞 {phone}</p>}
                  <p className="text-sm text-gray-700">{msg || '—'}</p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Reviews Tab ── */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          {loadingData ? (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          ) : reviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <p className="text-gray-400 font-medium">No reviews yet</p>
            </div>
          ) : (
            reviews.map(r => {
              const name = r.reviewer_name ?? r.customer_name ?? r.userName ?? 'Customer';
              const comment = r.comment ?? r.review ?? r.text ?? '';
              const rating = r.rating ?? r.stars ?? 0;
              const date = r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '';
              return (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{name}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rating >= 4 ? 'bg-green-50 text-green-700' : rating >= 3 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                        {Math.round(rating)}★
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{date}</span>
                  </div>
                  <p className="text-sm text-gray-700">{comment || '—'}</p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
