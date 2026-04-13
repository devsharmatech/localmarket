'use client';

import { useEffect, useState, useRef } from 'react';

export default function BannerManagement() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  const showStatus = (text, type = 'success') => {
    if (statusMessage) return; // Prevent stacking
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Location Selector State
  const [cities, setCities] = useState([]);
  const [availableCircles, setAvailableCircles] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    startDate: '',
    endDate: '',
    targetCity: '',
    targetCircle: '',
    link: '',
  });

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

  // Sync available circles when city changes
  useEffect(() => {
    if (!formData.targetCity) {
      setAvailableCircles([]);
      return;
    }

    setLoadingLocations(true);
    fetch(`/api/locations?city=${encodeURIComponent(formData.targetCity)}&limit=1000`)
      .then(res => res.json())
      .then(data => {
        if (data.locations) {
          const circles = Array.from(new Set(data.locations.map(l => l.circle))).sort();
          setAvailableCircles(circles);
        }
      })
      .catch(err => console.error('Failed to load circles:', err))
      .finally(() => setLoadingLocations(false));
  }, [formData.targetCity]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/banners');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showStatus(data?.error || 'Failed to load banners', 'error');
        } else if (!cancelled) {
          setBanners(Array.isArray(data?.banners) ? data.banners : []);
        }
      } catch (e) {
        if (!cancelled) showStatus(e?.message || 'Failed to load banners', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showStatus('Please select an image file', 'error');
      return;
    }

    if (file.size > 4.5 * 1024 * 1024) {
      showStatus('Image size should be less than 4.5MB', 'error');
      return;
    }

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('bucket', 'general');
      formDataUpload.append('folder', 'general');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');

      setFormData({ ...formData, imageUrl: data.url });
      setImagePreview(data.url);
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateBanner = async () => {
    try {
      if (!formData.imageUrl) {
        showStatus('Please upload an image or provide an image URL', 'error');
        return;
      }

      setUploading(true);
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          image_url: formData.imageUrl,
          link_url: formData.link || null,
          start_at: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          end_at: formData.endDate ? new Date(formData.endDate).toISOString() : null,
          target_city: formData.targetCity || null,
          target_circle: formData.targetCircle || null,
          active: true,
          sort_order: 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showStatus(data?.error || 'Failed to create banner', 'error');
        return;
      }

      if (data.warning) {
        showStatus('Saved locally: ' + data.warning, 'success');
        setShowForm(false);
        setFormData({ title: '', imageUrl: '', startDate: '', endDate: '', targetCircle: '', link: '' });
        setImagePreview(null);
        return;
      }

      // Reload banners to get the latest
      const reloadRes = await fetch('/api/banners', { cache: 'no-store' });
      const reloadData = await reloadRes.json().catch(() => ({}));
      if (reloadRes.ok) {
        setBanners(Array.isArray(reloadData?.banners) ? reloadData.banners : []);
      }

      setShowForm(false);
      setFormData({ title: '', imageUrl: '', startDate: '', endDate: '', targetCircle: '', link: '' });
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      showStatus(e?.message || 'Error creating banner', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleEditBanner = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      imageUrl: banner.image_url || '',
      startDate: banner.start_at ? new Date(banner.start_at).toISOString().split('T')[0] : '',
      endDate: banner.end_at ? new Date(banner.end_at).toISOString().split('T')[0] : '',
      targetCity: banner.target_city || '',
      targetCircle: banner.target_circle || '',
      link: banner.link_url || '',
    });
    setImagePreview(banner.image_url || null);
    setShowForm(true);
  };

  const handleUpdateBanner = async () => {
    try {
      if (!formData.imageUrl) {
        showStatus('Please upload an image or provide an image URL', 'error');
        return;
      }

      setUploading(true);
      const res = await fetch('/api/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBanner.id,
          title: formData.title,
          image_url: formData.imageUrl,
          link_url: formData.link || null,
          start_at: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          end_at: formData.endDate ? new Date(formData.endDate).toISOString() : null,
          target_city: formData.targetCity || null,
          target_circle: formData.targetCircle || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to update banner');

      showStatus('Banner updated successfully!');

      // Reload banners to get the latest
      const reloadRes = await fetch('/api/banners', { cache: 'no-store' });
      const reloadData = await reloadRes.json().catch(() => ({}));
      if (reloadRes.ok) {
        setBanners(Array.isArray(reloadData?.banners) ? reloadData.banners : []);
      }

      setShowForm(false);
      setEditingBanner(null);
      setFormData({ title: '', imageUrl: '', startDate: '', endDate: '', targetCircle: '', link: '' });
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      showStatus(e?.message || 'Error updating banner', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBanner(null);
    setFormData({ title: '', imageUrl: '', startDate: '', endDate: '', targetCircle: '', link: '' });
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleActive = async (banner) => {
    if (processing) return;
    try {
      setProcessing(true);
      const res = await fetch('/api/banners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: banner.id, active: !banner.active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showStatus(data?.error || 'Failed to update banner', 'error');
        return;
      }

      if (data.warning) {
        showStatus('Action pending: ' + data.warning, 'success');
        return;
      }
      setBanners(prev => prev.map(b => (b.id === banner.id ? 
        { ...b, active: !b.active } : b)));
    } catch (e) {
      showStatus(e?.message || 'Error updating banner', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (processing) return;
    setProcessing(true);
    if (!confirm('Are you sure you want to delete this banner?')) {
      setProcessing(false);
      return;
    }
    try {
      const res = await fetch(`/api/banners?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Delete failed');
      }
      showStatus('Banner deleted successfully');
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch (e) {
      showStatus(e.message || 'Error deleting banner', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-8">
      {/* Global Status Message */}
      {statusMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border animate-in fade-in slide-in-from-top-4 duration-300 ${statusMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{statusMessage.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium">{statusMessage.text}</span>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition"
          >
            + Upload Banner
          </button>
        )}
      </div>

      {/* Upload/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">
            {editingBanner ? 'Edit Banner' : 'Upload New Banner'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Banner Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Diwali Festival"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target City (Optional)</label>
              <select
                value={formData.targetCity}
                onChange={(e) => setFormData({ ...formData, targetCity: e.target.value, targetCircle: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">All Cities (Global)</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Circle (Optional)</label>
              <select
                value={formData.targetCircle}
                onChange={(e) => setFormData({ ...formData, targetCircle: e.target.value })}
                disabled={!formData.targetCity}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">{formData.targetCity ? 'All Circles in City' : 'Select City First'}</option>
                {availableCircles.map(circle => (
                  <option key={circle} value={circle}>{circle}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link URL (Optional)</label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="banner-image-upload"
                  />
                  <label
                    htmlFor="banner-image-upload"
                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition text-sm font-medium"
                  >
                    Upload Image
                  </label>
                  <span className="text-sm text-gray-500 self-center">or</span>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, imageUrl: e.target.value });
                      if (e.target.value) setImagePreview(e.target.value);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter image URL..."
                  />
                </div>
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 w-full object-cover rounded-lg border border-gray-200 bg-white"
                      onError={(e) => {
                        // Silently handle error to prevent render loops
                        e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL';
                        setImagePreview(null);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={editingBanner ? handleUpdateBanner : handleCreateBanner}
              disabled={uploading}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {uploading ? 'Saving...' : editingBanner ? 'Update Banner' : 'Upload Banner'}
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Banners List */}
      {loading && <div className="text-sm text-gray-600 mb-4">Loading banners…</div>}
      {!loading && banners.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No banners found. Click "+ Upload Banner" to create one.</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="h-48 bg-white relative overflow-hidden border-b border-gray-100">
              {banner.image_url ? (
                <img
                  src={banner.image_url}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null; // Prevent loops
                    e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image';
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full ${banner.image_url ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-r from-orange-400 to-red-500`}
              >
                <span className="text-white text-lg font-semibold">{banner.title || 'No Title'}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{banner.title || 'Untitled Banner'}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${banner.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                  {banner.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {banner.link_url && (
                <p className="text-xs text-blue-600 mb-2 truncate" title={banner.link_url}>
                  Link: {banner.link_url}
                </p>
              )}
              <p className="text-sm text-gray-600 mb-2">
                {banner.start_at ? new Date(banner.start_at).toLocaleDateString('en-IN') : '—'} to {banner.end_at ? new Date(banner.end_at).toLocaleDateString('en-IN') : '—'}
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEditBanner(banner)}
                  className="flex-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(banner)}
                  className={`flex-1 px-3 py-1 text-white text-xs rounded ${banner.active
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                  {banner.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteBanner(banner.id)}
                  className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200 transition"
                  title="Delete Banner"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
