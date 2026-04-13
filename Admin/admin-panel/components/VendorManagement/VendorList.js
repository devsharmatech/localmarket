'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { getStates, getCities, getTowns, getTehsils, getSubTehsils } from '../../constants/locations';

const statusColors = {
  Active: 'bg-green-100 text-green-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Blocked: 'bg-red-100 text-red-800',
};

export default function VendorList({ onViewProfile }) {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVendor, setEditingVendor] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [updatingFlag, setUpdatingFlag] = useState(null); // id of item flag being updated
  const [imagePreview, setImagePreview] = useState(null);

  // Simple SVG Icons
  const Icons = {
    ShieldCheck: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
    ),
    Star: ({ filled }) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    )
  };
  const [imageFile, setImageFile] = useState(null);
  const [availableCircles, setAvailableCircles] = useState([]);
  const [circleMappings, setCircleMappings] = useState({});
  const [loadingCircles, setLoadingCircles] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const imageFileInputRef = useRef(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [locationFilters, setLocationFilters] = useState({
    state: 'All',
    city: 'All',
    town: 'All',
    tehsil: 'All',
    subTehsil: 'All',
  });

  const states = ['All', ...getStates()];
  const cities = locationFilters.state === 'All' ? ['All'] : ['All', ...getCities(locationFilters.state)];
  const towns = locationFilters.state === 'All' || locationFilters.city === 'All'
    ? ['All']
    : ['All', ...getTowns(locationFilters.state, locationFilters.city)];
  const tehsils = locationFilters.state === 'All' || locationFilters.city === 'All' || locationFilters.town === 'All'
    ? ['All']
    : ['All', ...getTehsils(locationFilters.state, locationFilters.city, locationFilters.town)];
  const subTehsils = locationFilters.state === 'All' || locationFilters.city === 'All' || locationFilters.town === 'All' || locationFilters.tehsil === 'All'
    ? ['All']
    : ['All', ...getSubTehsils(locationFilters.state, locationFilters.city, locationFilters.town, locationFilters.tehsil)];

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filter && filter !== 'all') params.set('status', filter);
    if (searchQuery) params.set('q', searchQuery);

    if (locationFilters.state && locationFilters.state !== 'All') params.set('state', locationFilters.state);
    if (locationFilters.city && locationFilters.city !== 'All') params.set('city', locationFilters.city);
    if (locationFilters.town && locationFilters.town !== 'All') params.set('town', locationFilters.town);
    if (locationFilters.tehsil && locationFilters.tehsil !== 'All') params.set('tehsil', locationFilters.tehsil);
    if (locationFilters.subTehsil && locationFilters.subTehsil !== 'All') params.set('subTehsil', locationFilters.subTehsil);

    params.set('page', String(pagination.page));
    params.set('limit', String(pagination.limit));

    return params.toString();
  }, [filter, searchQuery, locationFilters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (editingVendor?.state && editingVendor?.city) {
      const fetchCircles = async () => {
        try {
          setLoadingCircles(true);
          const res = await fetch(`/api/locations?state=${encodeURIComponent(editingVendor.state)}&city=${encodeURIComponent(editingVendor.city)}`);
          const data = await res.json();
          if (data.locations) {
            const circles = Array.from(new Set(data.locations.map(l => l.circle).filter(Boolean))).sort();
            setAvailableCircles(circles);
            
            // Create a mapping of circle name to its first found location object for easier sync
            const mapping = {};
            data.locations.forEach(loc => {
              if (loc.circle && !mapping[loc.circle]) {
                mapping[loc.circle] = {
                  sub_tehsil: loc.sub_tehsil,
                  tehsil: loc.tehsil,
                  town: loc.town
                };
              }
            });
            setCircleMappings(mapping);
          }
        } catch (e) {
          console.error('Failed to fetch circles:', e);
        } finally {
          setLoadingCircles(false);
        }
      };
      fetchCircles();
    } else {
      setAvailableCircles([]);
      setCircleMappings({});
    }
  }, [editingVendor?.state, editingVendor?.city]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/vendors${queryString ? `?${queryString}` : ''}`, {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error || 'Failed to load vendors');
        } else if (!cancelled) {
          if (data.warning === 'offline_mode') {
            setError('Viewing offline data: Database unreachable');
          }
          setVendors(Array.isArray(data?.vendors) ? data.vendors : []);
          if (data.pagination) {
            setPagination(data.pagination);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load vendors');
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filter, searchQuery, locationFilters.state, locationFilters.city, locationFilters.town, locationFilters.tehsil, locationFilters.subTehsil]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: Number(newLimit), page: 1 }));
  };

  const handleLocationFilterChange = (key, value) => {
    setLocationFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      // Reset dependent filters
      if (key === 'state') {
        newFilters.city = 'All';
        newFilters.town = 'All';
        newFilters.tehsil = 'All';
        newFilters.subTehsil = 'All';
      } else if (key === 'city') {
        newFilters.town = 'All';
        newFilters.tehsil = 'All';
        newFilters.subTehsil = 'All';
      } else if (key === 'town') {
        newFilters.tehsil = 'All';
        newFilters.subTehsil = 'All';
      } else if (key === 'tehsil') {
        newFilters.subTehsil = 'All';
      }
      return newFilters;
    });
  };

  const handleStatusChange = async (vendorId, newStatus) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) {
      return;
    }

    try {
      setUpdatingStatus(vendorId);
      const res = await fetch('/api/vendors/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vendorId, status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || 'Failed to update status');
        return;
      }

      if (data.warning) {
        alert('Action pending: ' + data.warning);
        return;
      }

      // Update local state
      setVendors(prev => prev.map(v =>
        v.id === vendorId ? { ...v, status: newStatus } : v
      ));
    } catch (e) {
      alert(`Failed to update status: ${e.message}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const toggleFlag = async (vendorId, field, currentValue) => {
    try {
      setUpdatingFlag(vendorId);
      const res = await fetch('/api/featured', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: vendorId,
          type: 'vendors',
          field,
          value: !currentValue
        })
      });

      if (res.ok) {
        setVendors(prev => prev.map(v => 
          v.id === vendorId ? { ...v, [field]: !currentValue } : v
        ));
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to update flag:', err.error || 'Unknown error');
      }
    } catch (e) {
      console.error('Flag toggle error:', e);
    } finally {
      setUpdatingFlag(null);
    }
  };

  const handleDelete = (vendor) => {
    setVendorToDelete(vendor);
  };

  const confirmDelete = async () => {
    if (!vendorToDelete) return;

    try {
      setUpdatingStatus(vendorToDelete.id);
      const res = await fetch(`/api/vendors/${vendorToDelete.id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || 'Failed to delete vendor');
        return;
      }

      // Remove from local state
      setVendors(prev => prev.filter(v => v.id !== vendorToDelete.id));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      setVendorToDelete(null);
    } catch (e) {
      alert(`Failed to delete vendor: ${e.message}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleEdit = (vendor) => {
    // Only copy fields that are in the edit form, exclude numeric fields that might have empty strings
    setEditingVendor({
      id: vendor.id,
      name: vendor.name || '',
      owner: vendor.owner || vendor.ownerName || '',
      status: vendor.status || 'Pending',
      kycStatus: vendor.kycStatus || 'Pending',
      contactNumber: vendor.contactNumber || '',
      email: vendor.email || '',
      state: vendor.state || '',
      city: vendor.city || '',
      town: vendor.town || '',
      tehsil: vendor.tehsil || '',
      sub_tehsil: vendor.sub_tehsil || vendor.subTehsil || '',
      circle: vendor.circle || '',
      category: vendor.category || '',
      address: vendor.address || '',
      landmark: vendor.landmark || '',
      pincode: vendor.pincode || '',
      about: vendor.about || '',
      imageUrl: vendor.imageUrl || vendor.shopFrontPhotoUrl || null,
      shopFrontPhotoUrl: vendor.shopFrontPhotoUrl || vendor.imageUrl || null,
    });
    setImagePreview(vendor.imageUrl || vendor.shopFrontPhotoUrl || null);
    setImageFile(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setImagePreview(base64String);
      setEditingVendor({ ...editingVendor, imageUrl: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (url) => {
    setEditingVendor({ ...editingVendor, imageUrl: url });
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
      setImagePreview(url);
      setImageFile(null);
    } else if (!url) {
      setImagePreview(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingVendor.name?.trim()) {
      alert('Vendor name is required');
      return;
    }

    try {
      // Prepare update payload - only include fields that are in the edit form
      // Convert empty strings to null to avoid sending them
      const updatePayload = {
        id: editingVendor.id,
        name: editingVendor.name?.trim() || '',
      };

      // Only add fields that have values or are explicitly set
      if (editingVendor.owner !== undefined) {
        const ownerVal = typeof editingVendor.owner === 'string' ? editingVendor.owner.trim() : String(editingVendor.owner || '').trim();
        updatePayload.owner = ownerVal || null;
        updatePayload.owner_name = ownerVal || null;
      }
      if (editingVendor.status !== undefined) updatePayload.status = editingVendor.status || 'Pending';
      if (editingVendor.kycStatus !== undefined) updatePayload.kycStatus = editingVendor.kycStatus || 'Pending';
      if (editingVendor.contactNumber !== undefined) {
        const contactVal = typeof editingVendor.contactNumber === 'string' ? editingVendor.contactNumber.trim() : String(editingVendor.contactNumber || '').trim();
        updatePayload.contactNumber = contactVal || null;
      }
      if (editingVendor.email !== undefined) {
        const emailVal = typeof editingVendor.email === 'string' ? editingVendor.email.trim() : String(editingVendor.email || '').trim();
        updatePayload.email = emailVal || null;
      }
      if (editingVendor.state !== undefined) {
        const stateVal = typeof editingVendor.state === 'string' ? editingVendor.state.trim() : String(editingVendor.state || '').trim();
        updatePayload.state = stateVal || null;
      }
      if (editingVendor.city !== undefined) {
        const cityVal = typeof editingVendor.city === 'string' ? editingVendor.city.trim() : String(editingVendor.city || '').trim();
        updatePayload.city = cityVal || null;
      }
      if (editingVendor.category !== undefined) {
        const categoryVal = typeof editingVendor.category === 'string' ? editingVendor.category.trim() : String(editingVendor.category || '').trim();
        updatePayload.category = categoryVal || null;
      }
      if (editingVendor.circle !== undefined) {
        const circleVal = typeof editingVendor.circle === 'string' ? editingVendor.circle.trim() : String(editingVendor.circle || '').trim();
        updatePayload.circle = circleVal || null;
      }
      
      // Handle other location hierarchy fields that might have been updated from circle selection
      if (editingVendor.sub_tehsil !== undefined) updatePayload.subTehsil = editingVendor.sub_tehsil || null;
      if (editingVendor.tehsil !== undefined) updatePayload.tehsil = editingVendor.tehsil || null;
      if (editingVendor.town !== undefined) updatePayload.town = editingVendor.town || null;
       
      if (editingVendor.address !== undefined) updatePayload.address = editingVendor.address || null;
      if (editingVendor.landmark !== undefined) updatePayload.landmark = editingVendor.landmark || null;
      if (editingVendor.pincode !== undefined) updatePayload.pincode = editingVendor.pincode || null;
      if (editingVendor.about !== undefined) updatePayload.about = editingVendor.about || null;

      if (editingVendor.imageUrl !== undefined) updatePayload.imageUrl = editingVendor.imageUrl || null;
      if (editingVendor.shopFrontPhotoUrl !== undefined) {
        updatePayload.shopFrontPhotoUrl = editingVendor.imageUrl || editingVendor.shopFrontPhotoUrl || null;
      }

      const res = await fetch('/api/vendors/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || 'Failed to update vendor');
        return;
      }

      if (data.warning) {
        alert('Action pending: ' + data.warning);
        return;
      }

      // Reload vendors with current pagination
      const reloadParams = new URLSearchParams();
      if (filter && filter !== 'all') reloadParams.set('status', filter);
      if (searchQuery) reloadParams.set('q', searchQuery);
      if (locationFilters.state && locationFilters.state !== 'All') reloadParams.set('state', locationFilters.state);
      if (locationFilters.city && locationFilters.city !== 'All') reloadParams.set('city', locationFilters.city);
      if (locationFilters.town && locationFilters.town !== 'All') reloadParams.set('town', locationFilters.town);
      if (locationFilters.tehsil && locationFilters.tehsil !== 'All') reloadParams.set('tehsil', locationFilters.tehsil);
      if (locationFilters.subTehsil && locationFilters.subTehsil !== 'All') reloadParams.set('subTehsil', locationFilters.subTehsil);
      reloadParams.set('page', String(pagination.page));
      reloadParams.set('limit', String(pagination.limit));

      const loadRes = await fetch(`/api/vendors?${reloadParams.toString()}`, { cache: 'no-store' });
      const loadData = await loadRes.json().catch(() => ({}));
      if (loadRes.ok) {
        if (Array.isArray(loadData?.vendors)) {
          setVendors(loadData.vendors);
        }
        if (loadData.pagination) {
          setPagination(loadData.pagination);
        }
      }

      setEditingVendor(null);
      setImagePreview(null);
      setImageFile(null);
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
      alert('Vendor updated successfully');
    } catch (e) {
      alert(`Failed to update vendor: ${e.message}`);
    }
  };

  // Filter vendors (server-side filtering is already done, but we can do client-side filtering for search)

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="font-semibold">Failed to load vendors</div>
          <div className="text-sm mt-1">{error}</div>
          <div className="text-xs mt-2 text-red-700">
            Check admin env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only).
          </div>
        </div>
      )}

      {/* Search and Status Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Vendors ({vendors.length})</h2>
          {vendors.length > 0 && (
            <button
              onClick={async () => {
                try {
                  const params = new URLSearchParams();
                  if (filter !== 'all') params.set('status', filter);
                  if (locationFilters.state !== 'All') params.set('state', locationFilters.state);
                  if (locationFilters.city !== 'All') params.set('city', locationFilters.city);
                  const res = await fetch(`/api/vendors/export?${params.toString()}`, { cache: 'no-store' });
                  if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    alert(errorData.error || 'Failed to export');
                    return;
                  }
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `vendors_export_${new Date().toISOString().split('T')[0]}.xlsx`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch (e) {
                  alert(`Failed to export: ${e.message}`);
                }
              }}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              📥 Export Vendors
            </button>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 items-center">
            {['all', 'Active', 'Pending', 'Blocked'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status === 'all' ? 'all' : status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${filter === (status === 'all' ? 'all' : status)
                  ? 'gradient-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {status}
              </button>
            ))}
            {loading && <span className="text-sm text-gray-600 ml-2">Loading…</span>}
          </div>
        </div>
      </div>

      {/* Location Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Location Filters</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <select
              value={locationFilters.state}
              onChange={(e) => handleLocationFilterChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <select
              value={locationFilters.city}
              onChange={(e) => handleLocationFilterChange('city', e.target.value)}
              disabled={locationFilters.state === 'All'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Town</label>
            <select
              value={locationFilters.town}
              onChange={(e) => handleLocationFilterChange('town', e.target.value)}
              disabled={locationFilters.city === 'All'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {towns.map(town => (
                <option key={town} value={town}>{town}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tehsil</label>
            <select
              value={locationFilters.tehsil}
              onChange={(e) => handleLocationFilterChange('tehsil', e.target.value)}
              disabled={locationFilters.town === 'All'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {tehsils.map(tehsil => (
                <option key={tehsil} value={tehsil}>{tehsil}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Tehsil</label>
            <select
              value={locationFilters.subTehsil}
              onChange={(e) => handleLocationFilterChange('subTehsil', e.target.value)}
              disabled={locationFilters.tehsil === 'All'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {subTehsils.map(subTehsil => (
                <option key={subTehsil} value={subTehsil}>{subTehsil}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Total: {pagination.total} vendor(s)
          </p>
          <button
            onClick={() => setLocationFilters({
              state: 'All',
              city: 'All',
              town: 'All',
              tehsil: 'All',
              subTehsil: 'All',
            })}
            className="text-sm text-orange-600 hover:text-orange-800 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-600">Loading vendors...</div>
        ) : vendors.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            {searchQuery || filter !== 'all' || Object.values(locationFilters).some(f => f !== 'All')
              ? 'No vendors found matching your filters.'
              : 'No vendors found.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendor Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-widest">
                      Verified
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-widest">
                      Home
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      KYC Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative w-16 h-16">
                          {vendor.imageUrl || vendor.shopFrontPhotoUrl ? (
                            <img
                              src={vendor.imageUrl || vendor.shopFrontPhotoUrl}
                              alt={vendor.name || 'Vendor'}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={`image-placeholder w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center ${vendor.imageUrl || vendor.shopFrontPhotoUrl ? 'hidden' : ''}`}
                          >
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-mono font-black text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                          {vendor.displayId || vendor.display_id || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vendor.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{vendor.owner || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{vendor.contactNumber || '-'}</div>
                        {vendor.email && (
                          <div className="text-xs text-gray-500">{vendor.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {[vendor.city, vendor.state].filter(Boolean).join(', ') || '-'}
                        </div>
                        {(vendor.town || vendor.tehsil) && (
                          <div className="text-xs text-gray-500">
                            {[vendor.town, vendor.tehsil].filter(Boolean).join(' > ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{vendor.category || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          disabled={updatingFlag === vendor.id}
                          onClick={() => toggleFlag(vendor.id, 'is_verified', vendor.is_verified)}
                          className={`inline-flex p-1.5 rounded-full transition-all ${vendor.is_verified ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}
                        >
                          <Icons.ShieldCheck />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          disabled={updatingFlag === vendor.id}
                          onClick={() => toggleFlag(vendor.id, 'is_featured', vendor.is_featured)}
                          className={`inline-flex p-1.5 rounded-full transition-all ${vendor.is_featured ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}
                        >
                          <Icons.Star filled={vendor.is_featured} />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={vendor.status || 'Pending'}
                          onChange={(e) => handleStatusChange(vendor.id, e.target.value)}
                          disabled={updatingStatus === vendor.id}
                          className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer ${vendor.status === 'Active' ? 'bg-green-100 text-green-800' :
                            vendor.status === 'Blocked' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            } ${updatingStatus === vendor.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="Active">Active</option>
                          <option value="Pending">Pending</option>
                          <option value="Blocked">Blocked</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{vendor.kycStatus || 'Pending'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{vendor.productCount || 0}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(vendor)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onViewProfile(vendor)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(vendor)}
                            disabled={updatingStatus === vendor.id}
                            className={`text-red-600 hover:text-red-900 font-medium ${updatingStatus === vendor.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {updatingStatus === vendor.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} vendors
                  </span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-lg transition ${pagination.page === pageNum
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Vendor Modal */}
      {editingVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Vendor</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name *</label>
                <input
                  type="text"
                  value={editingVendor.name || ''}
                  onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter vendor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner Name</label>
                <input
                  type="text"
                  value={editingVendor.owner || ''}
                  onChange={(e) => setEditingVendor({ ...editingVendor, owner: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter owner name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingVendor.status || 'Pending'}
                    onChange={(e) => setEditingVendor({ ...editingVendor, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">KYC Status</label>
                  <select
                    value={editingVendor.kycStatus || 'Pending'}
                    onChange={(e) => setEditingVendor({ ...editingVendor, kycStatus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                  <input
                    type="text"
                    value={editingVendor.contactNumber || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, contactNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter contact number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editingVendor.email || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <select
                    value={editingVendor.state || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, state: e.target.value, city: '', circle: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select State</option>
                    {getStates().map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <select
                    value={editingVendor.city || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, city: e.target.value, circle: '' })}
                    disabled={!editingVendor.state}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select City</option>
                    {editingVendor.state && getCities(editingVendor.state).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={editingVendor.category || ''}
                  onChange={(e) => setEditingVendor({ ...editingVendor, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter category (e.g., Grocery, Bakery)"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                  <input
                    type="text"
                    value={editingVendor.pincode || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, pincode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="6-digit pincode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Landmark</label>
                  <input
                    type="text"
                    value={editingVendor.landmark || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, landmark: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nearby landmark"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                <textarea
                  value={editingVendor.address || ''}
                  onChange={(e) => setEditingVendor({ ...editingVendor, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[80px]"
                  placeholder="Enter detailed shop address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">About Shop</label>
                <textarea
                  value={editingVendor.about || ''}
                  onChange={(e) => setEditingVendor({ ...editingVendor, about: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[100px]"
                  placeholder="Tell customers about your shop, specialties, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market / Circle {loadingCircles && <span className="ml-2 text-xs text-orange-500 animate-pulse">(Loading...)</span>}
                </label>
                <select
                  value={editingVendor.circle || ''}
                  onChange={(e) => {
                    const circleName = e.target.value;
                    const mapping = circleMappings[circleName] || {};
                    setEditingVendor({ 
                      ...editingVendor, 
                      circle: circleName,
                      sub_tehsil: mapping.sub_tehsil || '',
                      tehsil: mapping.tehsil || '',
                      town: mapping.town || ''
                    });
                  }}
                  disabled={!editingVendor.city || loadingCircles}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Select Market / Circle</option>
                  {availableCircles.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {editingVendor.city && !loadingCircles && availableCircles.length === 0 && (
                    <option value="" disabled>No markets found for this city</option>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">Assign this vendor to a specific local market defined in Locations.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shop Image</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      ref={imageFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="vendor-image-upload"
                    />
                    <label
                      htmlFor="vendor-image-upload"
                      className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition text-sm font-medium"
                    >
                      Upload Image
                    </label>
                    <span className="text-sm text-gray-500 self-center">or</span>
                    <input
                      type="url"
                      value={editingVendor.imageUrl && !editingVendor.imageUrl.startsWith('data:') ? editingVendor.imageUrl : ''}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter image URL..."
                    />
                  </div>
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Vendor preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVendor({ ...editingVendor, imageUrl: '' });
                          setImagePreview(null);
                          setImageFile(null);
                          if (imageFileInputRef.current) imageFileInputRef.current.value = '';
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Upload an image file or enter an image URL</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingVendor(null)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {vendorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-red-100">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4 mx-auto">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 text-center">Delete Vendor?</h3>
            <p className="text-gray-500 text-center text-sm mb-6">
              Are you sure you want to permanently delete <span className="font-bold text-gray-900">"{vendorToDelete.name || vendorToDelete.shop_name}"</span>? 
              <br/><br/>
              This action <span className="text-red-600 font-bold underline">cannot be undone</span> and will remove all associated products, reviews, and enquiries.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setVendorToDelete(null)}
                disabled={updatingStatus === vendorToDelete.id}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={updatingStatus === vendorToDelete.id}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatingStatus === vendorToDelete.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



