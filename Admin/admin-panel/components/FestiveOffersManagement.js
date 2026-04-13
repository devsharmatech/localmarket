'use client';

import { useState, useEffect } from 'react';

export default function FestiveOffersManagement() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'vendor',
    target: 'all',
    circle: '',
    vendorIds: [],
    startDate: '',
    endDate: '',
    discount: '',
    description: '',
    image_url: '',
  });

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/festive-offers');
      if (res.ok) {
        const data = await res.json();
        setOffers(data);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async () => {
    try {
      // Validate required fields
      if (!formData.title || !formData.startDate || !formData.endDate) {
        alert('Please fill in all required fields (Title, Start Date, End Date)');
        return;
      }

      // Validate date format and ensure end date is after start date
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        alert('Please enter valid dates');
        return;
      }

      if (endDate < startDate) {
        alert('End date must be after start date');
        return;
      }

      // Format dates as YYYY-MM-DD for database
      const formattedStartDate = formData.startDate; // Already in YYYY-MM-DD format from date input
      const formattedEndDate = formData.endDate; // Already in YYYY-MM-DD format from date input

      const res = await fetch('/api/festive-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          type: formData.type,
          target: formData.target,
          circle: formData.circle?.trim() || null,
          vendor_ids: formData.vendorIds.length > 0 ? formData.vendorIds : null,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          discount_percent: formData.discount ? parseFloat(formData.discount) : null,
          description: formData.description?.trim() || null,
          image_url: formData.image_url || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        await loadOffers();
        setShowForm(false);
        setFormData({
          title: '',
          type: 'vendor',
          target: 'all',
          circle: '',
          vendorIds: [],
          startDate: '',
          endDate: '',
          discount: '',
          description: '',
          image_url: '',
        });
        alert('Offer created successfully!');
      } else {
        const errorMessage = data?.error || 'Failed to create offer';
        console.error('API Error:', errorMessage);
        alert(`Failed to create offer: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      alert(`Failed to create offer: ${error.message || 'Unknown error'}`);
    }
  };

  const handleToggleStatus = async (offerId) => {
    try {
      const offer = offers.find(o => o.id === offerId);
      if (!offer) return;

      const newStatus = offer.status === 'active' ? 'inactive' : 'active';
      const res = await fetch('/api/festive-offers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: offerId,
          status: newStatus,
        }),
      });

      if (res.ok) {
        await loadOffers();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to update offer');
      }
    } catch (error) {
      console.error('Error updating offer:', error);
      alert('Failed to update offer');
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('bucket', 'general');
      uploadData.append('folder', 'festive-offers');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, image_url: data.url }));
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Festive Offers Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition"
        >
          {showForm ? 'Cancel' : '+ Create Offer'}
        </button>
      </div>

      {/* Create Offer Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Create New Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Offer Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Diwali Special"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Offer Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="vendor">Vendor-wise</option>
                <option value="user">User-wise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target</label>
              <select
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All</option>
                <option value="circle">Circle-wise</option>
                <option value="specific">Specific</option>
              </select>
            </div>
            {formData.target === 'circle' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Circle</label>
                <input
                  type="text"
                  value={formData.circle}
                  onChange={(e) => setFormData({ ...formData, circle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Enter circle name"
                />
              </div>
            )}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount (%)</label>
              <input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Offer description..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Offer Image</label>
              <div className="flex items-center gap-4">
                {formData.image_url && (
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 transition-all cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-400 font-medium tracking-tight">Recommended: 1200x600px PNG or JPG</p>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleCreateOffer}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition"
          >
            Create Offer
          </button>
        </div>
      )}

      {/* Offers List */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Offers</h2>
          <button
            onClick={loadOffers}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading offers...</div>
        ) : offers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No offers found</div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div key={offer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                    <div className="mt-2 flex gap-4 text-sm text-gray-600">
                      <span>Type: <span className="font-semibold capitalize">{offer.type}-wise</span></span>
                      <span>Target: <span className="font-semibold capitalize">{offer.target}</span></span>
                      {offer.circle && <span>Circle: <span className="font-semibold">{offer.circle}</span></span>}
                      <span>Period: {offer.start_date ? new Date(offer.start_date).toLocaleDateString('en-IN') : '—'} to {offer.end_date ? new Date(offer.end_date).toLocaleDateString('en-IN') : '—'}</span>
                      {offer.discount_percent && <span>Discount: <span className="font-semibold">{offer.discount_percent}%</span></span>}
                    </div>
                  </div>
                </div>
                {offer.image_url && (
                  <div className="mt-4 relative w-full h-40 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-slate-50">
                    <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${offer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {offer.status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(offer.id)}
                      className={`px-3 py-1 rounded text-xs ${offer.status === 'active' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                        }`}
                    >
                      {offer.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
