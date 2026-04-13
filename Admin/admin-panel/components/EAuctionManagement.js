'use client';

import { useState, useEffect } from 'react';

export default function EAuctionManagement() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'e-auction',
    circle: '',
    startDate: '',
    endDate: '',
    description: '',
    minBid: '',
    maxParticipants: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/e-auctions');
      if (res.ok) {
        const data = await res.json();
        // Handle both array (legacy/online) and object (offline/resilient) formats
        if (Array.isArray(data)) {
          setAuctions(data);
        } else if (data && Array.isArray(data.auctions)) {
          setAuctions(data.auctions);
        } else {
          setAuctions([]);
        }
      }
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.type || !formData.circle || !formData.startDate || !formData.endDate) {
        alert('Please fill in all required fields');
        return;
      }

      const method = editingId ? 'PATCH' : 'POST';
      const body = {
        title: formData.title,
        type: formData.type,
        circle: formData.circle,
        start_date: formData.startDate,
        end_date: formData.endDate,
        description: formData.description || null,
        min_bid: formData.minBid || null,
        max_participants: formData.maxParticipants || null,
      };

      if (editingId) body.id = editingId;

      const res = await fetch('/api/e-auctions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await loadAuctions();
        setShowForm(false);
        resetForm();
        alert(editingId ? 'Event updated successfully!' : 'Event created successfully!');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to connect to server');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'e-auction',
      circle: '',
      startDate: '',
      endDate: '',
      description: '',
      minBid: '',
      maxParticipants: '',
    });
    setEditingId(null);
  };

  const handleEdit = (auction) => {
    setFormData({
      title: auction.title,
      type: auction.type,
      circle: auction.circle,
      startDate: auction.start_date || '',
      endDate: auction.end_date || '',
      description: auction.description || '',
      minBid: auction.min_bid || '',
      maxParticipants: auction.max_participants || '',
    });
    setEditingId(auction.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`/api/e-auctions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadAuctions();
        alert('Event deleted successfully');
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to connect to server');
    }
  };

  const fetchParticipants = async (auction) => {
    try {
      setSelectedAuction(auction);
      setLoadingParticipants(true);
      setShowParticipants(true);
      const res = await fetch(`/api/e-auctions/${auction.id}/participants`);
      if (res.ok) {
        setParticipants(await res.json());
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleSelectWinner = async (bidId) => {
    if (!confirm('Mark this participant as the winner and close the auction?')) return;
    try {
      const res = await fetch(`/api/e-auctions/${selectedAuction.id}/participants`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bid_id: bidId, status: 'winner' }),
      });
      if (res.ok) {
        alert('Winner selected and auction closed!');
        await loadAuctions();
        setShowParticipants(false);
      }
    } catch (error) {
      console.error('Error selecting winner:', error);
    }
  };

  const handleSendOffer = async (auctionId) => {
    if (!auctionId || auctionId === 'undefined') {
      alert('Cannot send offer: Auction ID is missing. Please refresh and try again.');
      return;
    }
    try {
      const res = await fetch(`/api/e-auctions/${auctionId}/send-offer`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.warning) {
          alert('Action pending: ' + data.warning);
          return;
        }
        await loadAuctions();
        alert(data.message || `Offers sent successfully to ${data.notifications_sent} users`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to send offers');
      }
    } catch (error) {
      console.error('Error sending offers:', error);
      alert(error.message || 'Failed to send offers');
    }
  };

  const handleStatusChange = async (auctionId, newStatus) => {
    try {
      const res = await fetch('/api/e-auctions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: auctionId, status: newStatus }),
      });

      if (res.ok) {
        await loadAuctions();
        alert(`Event status updated to ${newStatus}`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to connect to server');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">E-Auction & Online Draw Management</h1>
        <button
          onClick={() => {
            if (showForm) resetForm();
            setShowForm(!showForm);
          }}
          className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition"
        >
          {showForm ? 'Cancel' : '+ Create Event'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit' : 'Create'} E-Auction/Online Draw</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., Festive E-Auction"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="e-auction">E-Auction</option>
                <option value="online-draw">Online Draw</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Circle</label>
              <select
                value={formData.circle}
                onChange={(e) => setFormData({ ...formData, circle: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Circle</option>
                <option value="Connaught Place">Connaught Place</option>
                <option value="Saket">Saket</option>
                <option value="Vasant Kunj">Vasant Kunj</option>
                <option value="Chandni Chowk">Chandni Chowk</option>
              </select>
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
            {formData.type === 'e-auction' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Bid (₹)</label>
                <input
                  type="number"
                  value={formData.minBid}
                  onChange={(e) => setFormData({ ...formData, minBid: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., 100"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 1000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Event description..."
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:opacity-90 transition"
          >
            {editingId ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      )}

      {/* Events List */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Events</h2>
          <button
            onClick={loadAuctions}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading events...</div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No events found</div>
        ) : (
          <div className="space-y-4">
            {auctions.map((auction) => (
              <div key={auction.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{auction.title}</h3>
                    <div className="mt-2 flex gap-4 text-sm text-gray-600">
                      <span>Circle: <span className="font-semibold">{auction.circle}</span></span>
                      <span>Type: <span className="font-semibold capitalize">{auction.type}</span></span>
                      <span>Period: {auction.startDate} to {auction.endDate}</span>
                    </div>
                    <div className="mt-2 flex gap-4 text-sm">
                      <span>Participants: <span className="font-semibold">{auction.participants_count || 0}</span></span>
                      <span>Offers: <span className="font-semibold">{auction.offers_count || 0}</span></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {auction.status !== 'active' && auction.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(auction.id, 'active')}
                        className="px-4 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 font-bold"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(auction)}
                      className="px-4 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(auction.id)}
                      className="px-4 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => fetchParticipants(auction)}
                      className="px-4 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 font-bold"
                    >
                      View Participants
                    </button>
                    <button
                      onClick={() => handleSendOffer(auction.id)}
                      className="px-4 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"
                    >
                      Notify Circle
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Participants Modal */}
      {showParticipants && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-black text-gray-900">Participants: {selectedAuction?.title}</h2>
                <p className="text-sm text-gray-500 mt-1">Total {participants.length} entries found</p>
              </div>
              <button
                onClick={() => setShowParticipants(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingParticipants ? (
                <div className="text-center py-12 text-gray-400 font-medium">Fetching participants...</div>
              ) : participants.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 font-medium text-lg">No one has entered yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Entries will appear here once users submit bids from the website.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="py-4 px-4 text-xs font-black uppercase text-gray-400 tracking-wider">Bidder Details</th>
                        <th className="py-4 px-4 text-xs font-black uppercase text-gray-400 tracking-wider">Contact</th>
                        <th className="py-4 px-4 text-xs font-black uppercase text-gray-400 tracking-wider text-right">Bid Amount</th>
                        <th className="py-4 px-4 text-xs font-black uppercase text-gray-400 tracking-wider text-center">Status</th>
                        <th className="py-4 px-4 text-xs font-black uppercase text-gray-400 tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((p) => (
                        <tr key={p.id} className={`border-b border-gray-50 transition-colors ${p.status === 'winner' ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                          <td className="py-4 px-4">
                            <div className="font-bold text-gray-900">{p.bidder_name}</div>
                            {p.message && <div className="text-xs text-gray-500 italic mt-1 max-w-[200px] truncate">"{p.message}"</div>}
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-gray-600">{p.bidder_phone}</div>
                            <div className="text-xs text-gray-400">{p.bidder_email}</div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {p.bid_amount ? (
                              <div className="font-black text-gray-900">₹{parseFloat(p.bid_amount).toLocaleString()}</div>
                            ) : (
                              <span className="text-gray-300 text-xs">ENTRY ONLY</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'winner' ? 'bg-green-100 text-green-700' :
                                p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {p.status !== 'winner' && (
                              <button
                                onClick={() => handleSelectWinner(p.id)}
                                className="px-4 py-1.5 bg-green-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-green-700 shadow-md shadow-green-100 transition-all active:scale-95"
                              >
                                Select Winner
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowParticipants(false)}
                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
