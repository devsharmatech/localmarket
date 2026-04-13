'use client';

import { useEffect, useMemo, useState } from 'react';
import LocationImport from './LocationImport';

export default function LocationManagement() {
  const [activeTab, setActiveTab] = useState('browse');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTown, setSelectedTown] = useState('');
  const [selectedTehsil, setSelectedTehsil] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    state: '',
    city: '',
    town: '',
    tehsil: '',
    subTehsil: '',
    circle: '',
    market_icon: '',
  });
  const [circleFormData, setCircleFormData] = useState({
    state: '',
    city: '',
    name: '',
  });
  const [marketFormData, setMarketFormData] = useState({
    state: '',
    city: '',
    circleArea: '',
    name: '',
    icon: '',
  });
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [editingMarket, setEditingMarket] = useState(null);
  const [editingCircle, setEditingCircle] = useState(null);
  const [showAddCircleForm, setShowAddCircleForm] = useState(false);
  const [showAddMarketForm, setShowAddMarketForm] = useState(false);

  const reloadLocations = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/locations?limit=2000', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to load locations');
      setLocations(Array.isArray(data?.locations) ? data.locations : []);
    } catch (e) {
      setError(e?.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/locations?limit=2000', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Failed to load locations');
        if (!cancelled) setLocations(Array.isArray(data?.locations) ? data.locations : []);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load locations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const states = useMemo(() => {
    return Array.from(new Set(locations.map(l => l.state))).sort();
  }, [locations]);

  const cities = useMemo(() => {
    const stateToFilter = formData.state || selectedState || circleFormData.state || marketFormData.state;
    if (!stateToFilter) return [];
    return Array.from(new Set(locations.filter(l => l.state === stateToFilter).map(l => l.city))).sort();
  }, [locations, selectedState, formData.state, circleFormData.state, marketFormData.state]);

  const towns = useMemo(() => {
    const s = formData.state || selectedState || circleFormData.state || marketFormData.state;
    const c = formData.city || selectedCity || circleFormData.city || marketFormData.city;
    if (!s || !c) return [];
    return Array.from(new Set(locations.filter(l => l.state === s && l.city === c).map(l => l.town))).sort();
  }, [locations, selectedState, selectedCity, formData.state, formData.city, circleFormData.state, circleFormData.city, marketFormData.state, marketFormData.city]);

  const tehsils = useMemo(() => {
    const s = formData.state || selectedState;
    const c = formData.city || selectedCity;
    const t = formData.town || selectedTown;
    if (!s || !c || !t) return [];
    return Array.from(new Set(locations.filter(l => l.state === s && l.city === c && l.town === t).map(l => l.tehsil))).sort();
  }, [locations, selectedState, selectedCity, selectedTown, formData.state, formData.city, formData.town]);

  const subTehsils = useMemo(() => {
    const s = formData.state || selectedState;
    const c = formData.city || selectedCity;
    const t = formData.town || selectedTown;
    const th = formData.tehsil || selectedTehsil;
    if (!s || !c || !t || !th) return [];
    return Array.from(
      new Set(
        locations
          .filter(l => l.state === s && l.city === c && l.town === t && l.tehsil === th)
          .map(l => l.sub_tehsil)
      )
    ).sort();
  }, [locations, selectedState, selectedCity, selectedTown, selectedTehsil, formData.state, formData.city, formData.town, formData.tehsil]);

  const circleIcons = useMemo(() => {
    const map = {};
    locations.forEach(l => {
      if (l.circle && l.market_icon && !map[l.circle]) {
        map[l.circle] = l.market_icon;
      }
    });
    return map;
  }, [locations]);
  const handleAddLocation = async () => {
    try {
      setResult(null);
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to add location');
      setLocations(prev => [data.location, ...prev]);
      setFormData({ state: '', city: '', town: '', tehsil: '', subTehsil: '', circle: '', market_icon: '' });
      setShowAddForm(false);
      setResult({ success: true, message: 'Location added successfully.' });
    } catch (e) {
      setResult({ success: false, message: e?.message || 'Failed to add location' });
    }
  };

  const handleCreateCircle = async () => {
    try {
      setResult(null);
      if (!circleFormData.state || !circleFormData.city || !circleFormData.name) {
        throw new Error('Please fill all fields');
      }

      // Circle in our DB is represented by the same town/tehsil/sub_tehsil name
      const body = {
        state: circleFormData.state,
        city: circleFormData.city,
        town: circleFormData.name,
        tehsil: circleFormData.name,
        subTehsil: circleFormData.name,
        circle: null, // No market yet
      };

      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create circle');
      
      setLocations(prev => [data.location, ...prev]);
      setCircleFormData({ state: '', city: '', name: '' });
      setShowAddCircleForm(false);
      setResult({ success: true, message: `Circle "${circleFormData.name}" created successfully.` });
    } catch (e) {
      setResult({ success: false, message: e.message });
    }
  };

  const handleCreateMarket = async () => {
    try {
      setResult(null);
      if (!marketFormData.state || !marketFormData.city || !marketFormData.circleArea || !marketFormData.name) {
        throw new Error('Please fill all required fields');
      }

      const body = {
        state: marketFormData.state,
        city: marketFormData.city,
        town: marketFormData.circleArea,
        tehsil: marketFormData.circleArea,
        subTehsil: marketFormData.circleArea,
        circle: marketFormData.name,
        market_icon: marketFormData.icon,
      };

      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create market');
      
      setLocations(prev => [data.location, ...prev]);
      setMarketFormData({ state: '', city: '', circleArea: '', name: '', icon: '' });
      setShowAddMarketForm(false);
      setResult({ success: true, message: `Market "${marketFormData.name}" created successfully.` });
    } catch (e) {
      setResult({ success: false, message: e.message });
    }
  };

  const handleDeleteCircle = async (circleName) => {
    if (!window.confirm(`Are you sure you want to delete the circle "${circleName}"? This will delete all markets within this circle.`)) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/locations?circleName=${encodeURIComponent(circleName)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete circle');
      
      setResult({ success: true, message: `Circle "${circleName}" and all its markets deleted successfully.` });
      reloadLocations();
    } catch (e) {
      setResult({ success: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRenameCircle = async () => {
    if (!editingCircle.newName.trim() || editingCircle.newName === editingCircle.oldName) {
      setEditingCircle(null);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renameCircleFrom: editingCircle.oldName,
          renameCircleTo: editingCircle.newName,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update circle');
      
      setResult({ success: true, message: `Circle renamed successfully.` });
      setEditingCircle(null);
      reloadLocations();
    } catch (e) {
      setResult({ success: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };
   // Removed duplicate editingMarket state declaration from here

  const handleDeleteMarket = async (marketName) => {
    if (!window.confirm(`Are you sure you want to delete the market "${marketName}"? This will unassign all locations and vendors from this market.`)) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/locations?marketName=${encodeURIComponent(marketName)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete market');
      
      setResult({ success: true, message: `Market "${marketName}" deleted successfully.` });
      reloadLocations();
    } catch (e) {
      setResult({ success: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRenameMarket = async () => {
    if (!editingMarket.newName.trim() || editingMarket.newName === editingMarket.oldName) {
      setEditingMarket(null);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renameFrom: editingMarket.oldName,
          renameTo: editingMarket.newName,
          marketIcon: editingMarket.icon
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update market');
      
      setResult({ success: true, message: `Market updated successfully.` });
      setEditingMarket(null);
      reloadLocations();
    } catch (e) {
      setResult({ success: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadIcon = async (e, isEditing = false) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('bucket', 'general');
      formDataUpload.append('folder', 'market-icons');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const dataUpload = await res.json();
      if (!res.ok) throw new Error(dataUpload.error || 'Upload failed');

      if (isEditing) {
        setEditingMarket(prev => ({ ...prev, icon: dataUpload.url }));
      } else if (activeTab === 'circles') {
        // Not used for circles right now but keeping for safety
      } else if (activeTab === 'markets') {
        setMarketFormData(prev => ({ ...prev, icon: dataUpload.url }));
      } else {
        setFormData(prev => ({ ...prev, market_icon: dataUpload.url }));
      }

      setResult({ success: true, message: 'Icon uploaded successfully' });
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setUploading(false);
    }
  };

  // Removed duplicate result state declaration from here

  const locationCount = locations.length;
  const cityCount = useMemo(() => new Set(locations.map(l => `${l.state}::${l.city}`)).size, [locations]);
  const townCount = useMemo(() => new Set(locations.map(l => `${l.state}::${l.city}::${l.town}`)).size, [locations]);

  // reloadLocations moved up

  const tabs = [
    { id: 'browse', label: 'Browse Locations' },
    { id: 'circles', label: 'Manage Circles (Areas)' },
    { id: 'markets', label: 'Manage Markets' },
    { id: 'import', label: 'Import Locations' },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="font-semibold">Location API error</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      )}
      {result && (
        <div className={`rounded-lg p-4 ${result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {result.message}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === tab.id
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <LocationImport onImportSuccess={reloadLocations} />
      )}

      {/* Circles Tab */}
      {activeTab === 'circles' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Circle (Area) Management</h2>
                <p className="text-sm text-gray-500 mt-1">Hierarchical Flow: State → City → Circle</p>
              </div>
              <button
                onClick={() => setShowAddCircleForm(!showAddCircleForm)}
                className="gradient-primary text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
              >
                {showAddCircleForm ? 'Cancel' : '+ Create New Circle'}
              </button>
            </div>

            {showAddCircleForm && (
              <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">State</label>
                    <select
                      value={circleFormData.state}
                      onChange={(e) => setCircleFormData({ ...circleFormData, state: e.target.value, city: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="">Select State</option>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">City</label>
                    <select
                      value={circleFormData.city}
                      onChange={(e) => setCircleFormData({ ...circleFormData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                      disabled={!circleFormData.state}
                    >
                      <option value="">Select City</option>
                      {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Circle Name (e.g., Amritsar-1)</label>
                    <input
                      type="text"
                      value={circleFormData.name}
                      onChange={(e) => setCircleFormData({ ...circleFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white"
                      placeholder="Enter circle name"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                   <button
                    onClick={handleCreateCircle}
                    className="gradient-primary text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-orange-200 hover:scale-[1.02] transition"
                  >
                    Create Circle
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from(new Set(locations.map(l => l.town))).sort().map((circle, idx) => (
                <div key={idx} className="p-4 border border-gray-100 rounded-xl bg-slate-50 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/></svg>
                    </div>
                    <div>
                      <span className="font-bold text-gray-900">{circle}</span>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                        {locations.find(l => l.town === circle)?.city || 'Unknown City'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">
                      {locations.filter(l => l.town === circle && l.circle).length} Markets
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingCircle({ oldName: circle, newName: circle })}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Circle"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteCircle(circle)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Circle"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Circle Modal */}
          {editingCircle && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="text-xl font-bold text-gray-900">Edit Circle (Area)</h3>
                  <button onClick={() => setEditingCircle(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Circle Name</label>
                    <input
                      type="text"
                      value={editingCircle.newName}
                      onChange={(e) => setEditingCircle({ ...editingCircle, newName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm"
                      placeholder="Enter circle name"
                    />
                    <p className="text-[10px] text-gray-400 mt-2">Note: This will rename the area for all associated markets.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingCircle(null)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRenameCircle}
                    className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Markets Tab */}
      {activeTab === 'markets' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Market Management</h2>
                <p className="text-sm text-gray-500 mt-1">Select an existing Circle to add a specific Market Hub</p>
              </div>
              <button
                onClick={() => setShowAddMarketForm(!showAddMarketForm)}
                className="gradient-primary text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
              >
                {showAddMarketForm ? 'Cancel' : '+ Add New Market'}
              </button>
            </div>

            {showAddMarketForm && (
              <div className="mb-6 p-6 bg-orange-50 border border-orange-200 rounded-xl space-y-6">
                <div className="flex items-center gap-2 mb-2">
                   <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                   </div>
                   <h3 className="font-bold text-orange-900">Create New Market</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Step 1: Base Location */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">State</label>
                        <select
                          value={marketFormData.state}
                          onChange={(e) => setMarketFormData({ ...marketFormData, state: e.target.value, city: '', circleArea: '' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                        >
                          <option value="">Select State</option>
                          {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">City</label>
                        <select
                          value={marketFormData.city}
                          onChange={(e) => setMarketFormData({ ...marketFormData, city: e.target.value, circleArea: '' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                          disabled={!marketFormData.state}
                        >
                          <option value="">Select City</option>
                          {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Circle / Area</label>
                      <select
                        value={marketFormData.circleArea}
                        onChange={(e) => setMarketFormData({ ...marketFormData, circleArea: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                        disabled={!marketFormData.city}
                      >
                        <option value="">-- Choose Existing Circle --</option>
                        {towns.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium italic">Don't see your circle? Create it in the "Manage Circles" tab first.</p>
                    </div>
                  </div>

                  {/* Step 2: Market Details */}
                  <div className="space-y-4 p-4 bg-white rounded-xl border border-orange-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Market Name (Specific Hub)</label>
                      <input
                        type="text"
                        value={marketFormData.name}
                        onChange={(e) => setMarketFormData({ ...marketFormData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g., South Market"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Market Icon</label>
                      <div className="flex items-center gap-3">
                        {marketFormData.icon ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <img src={marketFormData.icon} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => setMarketFormData({ ...marketFormData, icon: '' })}
                              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg shadow"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                            </button>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 border border-dashed border-slate-300">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadIcon(e)}
                          className="hidden"
                          id="market-icon-upload"
                        />
                        <label 
                          htmlFor="market-icon-upload"
                          className="flex-1 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-lg text-xs font-bold text-center transition"
                        >
                          {uploading ? 'Uploading...' : 'Upload Market Icon'}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-orange-200">
                  <button
                    onClick={() => setShowAddMarketForm(false)}
                    className="px-6 py-2 text-gray-600 font-semibold hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateMarket}
                    className="gradient-primary text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-orange-200 hover:scale-[1.02] transition"
                  >
                    Create Market
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {Array.from(new Set(locations.filter(l => l.circle).map(l => l.circle))).sort().map((circle, idx) => (
                <div key={idx} className="p-4 border border-gray-100 rounded-xl bg-slate-50 flex items-center justify-between group relative">
                    <div className="flex items-center gap-3">
                      {circleIcons[circle] ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                          <img src={circleIcons[circle]} alt={circle} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-gray-900">{circle}</span>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Active Market</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingMarket({ oldName: circle, newName: circle, icon: circleIcons[circle] || '' })}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Market"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteMarket(circle)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Market"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                      </button>
                    </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Edit Market Modal */}
          {editingMarket && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="text-xl font-bold text-gray-900">Edit Market</h3>
                  <button onClick={() => setEditingMarket(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Market Name</label>
                    <input
                      type="text"
                      value={editingMarket.newName}
                      onChange={(e) => setEditingMarket({ ...editingMarket, newName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm"
                      placeholder="Enter market name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Market Icon</label>
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      {editingMarket.icon ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-md group">
                          <img src={editingMarket.icon} alt="Icon preview" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setEditingMarket({ ...editingMarket, icon: '' })}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center text-gray-300 border border-dashed border-gray-300 font-bold text-xs text-center p-1">
                          No Icon
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadIcon(e, true)}
                          className="hidden"
                          id="edit-modal-icon-upload"
                        />
                        <label 
                          htmlFor="edit-modal-icon-upload"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors cursor-pointer shadow-sm shadow-orange-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><polyline points="16 5 22 5"/><polyline points="19 2 19 8"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L12 15"/></svg>
                          {uploading ? 'Uploading...' : 'Upload New Icon'}
                        </label>
                        <p className="text-[10px] text-gray-400 font-medium">Recommended: Square PNG, 512x512px</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingMarket(null)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRenameMarket}
                    className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total States</div>
              <div className="text-2xl font-bold text-gray-900">{states.length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Cities</div>
              <div className="text-2xl font-bold text-gray-900">{cityCount}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Towns</div>
              <div className="text-2xl font-bold text-gray-900">{townCount}</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Locations</div>
              <div className="text-2xl font-bold text-gray-900">{locationCount}</div>
            </div>
          </div>

          {/* Location Browser */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Location Browser</h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="gradient-primary text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition"
              >
                {showAddForm ? 'Cancel' : '+ Add Location'}
              </button>
            </div>

            {/* Add Location Form */}
            {showAddForm && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-4">Add New Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter State"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
                    <input
                      type="text"
                      value={formData.town}
                      onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter Town"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tehsil</label>
                    <input
                      type="text"
                      value={formData.tehsil}
                      onChange={(e) => setFormData({ ...formData, tehsil: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter Tehsil"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Tehsil</label>
                    <input
                      type="text"
                      value={formData.subTehsil}
                      onChange={(e) => setFormData({ ...formData, subTehsil: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter Sub-Tehsil"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Circle (Optional)</label>
                    <input
                      type="text"
                      value={formData.circle}
                      onChange={(e) => setFormData({ ...formData, circle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., North Circle"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddLocation}
                  className="mt-4 gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition"
                >
                  Add Location
                </button>
              </div>
            )}

            {/* Location Hierarchy Browser */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select State</label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedCity('');
                    setSelectedTown('');
                    setSelectedTehsil('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">-- Select State --</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {selectedState && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setSelectedTown('');
                      setSelectedTehsil('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">-- Select City --</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedState && selectedCity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Town</label>
                  <select
                    value={selectedTown}
                    onChange={(e) => {
                      setSelectedTown(e.target.value);
                      setSelectedTehsil('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">-- Select Town --</option>
                    {towns.map(town => (
                      <option key={town} value={town}>{town}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedState && selectedCity && selectedTown && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Tehsil</label>
                  <select
                    value={selectedTehsil}
                    onChange={(e) => setSelectedTehsil(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">-- Select Tehsil --</option>
                    {tehsils.map(tehsil => (
                      <option key={tehsil} value={tehsil}>{tehsil}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedState && selectedCity && selectedTown && selectedTehsil && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Tehsils</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    {subTehsils.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {subTehsils.map((subTehsil, index) => (
                          <div key={index} className="bg-white px-3 py-2 rounded border border-gray-200">
                            {subTehsil}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No sub-tehsils available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location List */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Locations</h2>
            {loading ? (
              <div className="text-sm text-gray-600">Loading locations…</div>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">State</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">City</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Town</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Tehsil</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Sub-Tehsil</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Circle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {locations.slice(0, 500).map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{l.state}</td>
                      <td className="px-4 py-2 text-gray-900">{l.city}</td>
                      <td className="px-4 py-2 text-gray-900">{l.town}</td>
                      <td className="px-4 py-2 text-gray-900">{l.tehsil}</td>
                      <td className="px-4 py-2 text-gray-900">{l.sub_tehsil}</td>
                      <td className="px-4 py-2 text-gray-700">{l.circle || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">Showing first {Math.min(500, locations.length)} locations.</p>
          </div>
        </>
      )}
    </div>
  );
}
