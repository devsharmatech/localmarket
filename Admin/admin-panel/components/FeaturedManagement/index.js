'use client';

import { useState, useEffect } from 'react';

// Simple SVG Icon components to replace lucide-react dependency
const Icons = {
  ShieldCheck: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
  ),
  Star: ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  ),
  Tag: ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
  ),
  Zap: ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.5 14 3l-2.5 8.5H20L10 22.5 12.5 14H4z"/></svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  ),
  Filter: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
  ),
  RefreshCw: ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  ),
  AlertCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
  )
};

export default function FeaturedManagement() {
  const [activeTab, setActiveTab] = useState('vendors'); // 'vendors' or 'products'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCity, setFilterCity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState(null); // id of item being updated
  const [cities, setCities] = useState([]);

  // Modal & Global Search State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalResults, setGlobalResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Global search handler
  const handleGlobalSearch = async (query) => {
    if (!query || query.length < 2) {
      setGlobalResults([]);
      return;
    }

    try {
      setSearching(true);
      const type = activeTab === 'vendors' ? 'vendors' : 'products';
      const res = await fetch(`/api/search/global?q=${encodeURIComponent(query)}&type=${type}`);
      const results = await res.json();
      setGlobalResults(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error('Global search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Load unique cities for filter
  useEffect(() => {
    fetch('/api/locations?limit=2000')
      .then(res => res.json())
      .then(res => {
        if (res.locations) {
          const uniqueCities = Array.from(new Set(res.locations.map(l => l.city))).sort();
          setCities(uniqueCities);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch featured management data
  const fetchData = async () => {
    try {
      setLoading(true);
      let url = `/api/featured?type=${activeTab}`;
      if (filterCity !== 'all') url += `&city=${encodeURIComponent(filterCity)}`;
      
      const res = await fetch(url);
      const resData = await res.json();
      setData(Array.isArray(resData) ? resData : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, filterCity]);

  // Toggle flag
  const toggleFlag = async (id, field, currentValue) => {
    try {
      setUpdating(id);
      const res = await fetch('/api/featured', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          type: activeTab,
          field,
          value: !currentValue
        })
      });

      if (res.ok) {
        // Update local state
        setData(prev => prev.map(item => 
          item.id === id ? { ...item, [field]: !currentValue } : item
        ));
      }
    } catch (err) {
      console.error('Failed to update flag:', err);
    } finally {
      setUpdating(null);
    }
  };

  const filteredData = data.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Featured Content Management</h1>
            <p className="text-slate-500 text-sm">Control what highlights appear on the website home page</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all"
          >
            <Icons.RefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex border-b border-slate-200 mb-6 justify-between items-center pr-2">
          <div className="flex">
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'vendors' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              🏢 Verified & Featured Shops
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'products' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              🏷️ Deals & Price Drops
            </button>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white gradient-primary rounded-lg hover:opacity-90 transition-all shadow-sm"
          >
            <span className="text-sm">+</span>
            Promote {activeTab === 'vendors' ? 'Shop' : 'Product'}
          </button>
        </div>

        {/* ── SEARCH MODAL ── */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Promote {activeTab === 'vendors' ? 'Store' : 'Item'} to Home</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1">Search and select anything to highlight on the website</p>
                </div>
                <button onClick={() => { setIsAddModalOpen(false); setGlobalSearch(''); setGlobalResults([]); }} className="p-2 text-slate-400 hover:text-slate-900 rounded-lg transition-colors">
                  <Icons.X />
                </button>
              </div>
              <div className="p-6">
                <div className="relative mb-6">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></div>
                  <input 
                    type="text"
                    autoFocus
                    placeholder={`Search any ${activeTab === 'vendors' ? 'vendor name' : 'product'}...`}
                    value={globalSearch}
                    onChange={(e) => {
                      setGlobalSearch(e.target.value);
                      handleGlobalSearch(e.target.value);
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-slate-900 font-medium"
                  />
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {searching ? (
                    <div className="py-12 text-center text-slate-400 font-medium flex flex-col items-center gap-3">
                      <Icons.RefreshCw className="animate-spin text-orange-500" />
                      Searching database...
                    </div>
                  ) : globalResults.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 font-medium">
                      {globalSearch ? 'No matches found. Try a different name.' : 'Type a name to search the database'}
                    </div>
                  ) : globalResults.map(res => (
                    <div key={res.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black shrink-0 relative overflow-hidden ring-1 ring-orange-50 ring-inset">
                          {res.imageUrl || res.image_url ? (
                            <img src={res.imageUrl || res.image_url} className="w-full h-full object-cover" />
                          ) : (res.name?.charAt(0))}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 line-clamp-1">{res.name || res.shop_name}</div>
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">
                            {res.city} · {res.circle || 'Local Market'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const field = activeTab === 'vendors' ? 'is_featured' : 'is_featured';
                          await toggleFlag(res.id, field, false);
                          setIsAddModalOpen(false);
                          setGlobalSearch('');
                          setGlobalResults([]);
                          fetchData();
                        }}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-sm active:scale-95"
                      >
                        Promote
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icons.Search />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-slate-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-slate-400"><Icons.Filter /></div>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 text-sm font-medium"
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Location</th>
                {activeTab === 'vendors' ? (
                  <>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Verified</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Featured</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Price Info</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Home Deal</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Price Drop</th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Mega Saving</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">Loading items...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">No records found matching your criteria</td>
                </tr>
              ) : filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img src={item.image_url} className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-black">
                          {item.name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-slate-900">{item.name}</div>
                        {activeTab === 'products' && (
                          <div className="text-[10px] font-medium text-slate-400 uppercase">{item.vendors?.name}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 font-medium">{item.city || item.vendors?.city}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{item.circle || item.vendors?.circle || 'General'}</div>
                  </td>
                  
                  {activeTab === 'vendors' ? (
                    <>
                      <td className="px-6 py-4 text-center">
                        <button
                          disabled={updating === item.id}
                          onClick={() => toggleFlag(item.id, 'is_verified', item.is_verified)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${item.is_verified ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        >
                          {item.is_verified ? <Icons.ShieldCheck /> : <Icons.X />}
                          {item.is_verified ? 'Verified' : 'Unverified'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          disabled={updating === item.id}
                          onClick={() => toggleFlag(item.id, 'is_featured', item.is_featured)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${item.is_featured ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                        >
                          <Icons.Star filled={item.is_featured} />
                          {item.is_featured ? 'Featured' : 'Regular'}
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-900">₹{item.price}</div>
                        <div className="text-[10px] text-slate-400 line-through">MRP: ₹{item.mrp}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          disabled={updating === item.id}
                          onClick={() => toggleFlag(item.id, 'is_featured', item.is_featured)}
                          className={`p-2 rounded-lg transition-all ${item.is_featured ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                        >
                          <Icons.Zap filled={item.is_featured} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          disabled={updating === item.id}
                          onClick={() => toggleFlag(item.id, 'is_price_drop', item.is_price_drop)}
                          className={`p-2 rounded-lg transition-all ${item.is_price_drop ? 'bg-red-100 text-red-700 ring-1 ring-red-200' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                        >
                          <Icons.Tag filled={item.is_price_drop} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          disabled={updating === item.id}
                          onClick={() => toggleFlag(item.id, 'is_mega_saving', item.is_mega_saving)}
                          className={`p-2 rounded-lg transition-all ${item.is_mega_saving ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                        >
                          <Icons.Zap filled={item.is_mega_saving} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <div className="text-blue-500 shrink-0"><Icons.AlertCircle /></div>
        <div className="text-xs text-blue-700 font-medium">
          <strong>Tip:</strong> Flagged items appear instantly on the website. Highlighting a vendor as "Verified" adds a gold badge across the site. "Price Drops" and "Mega Savings" create high-visibility banners in the homepage deals sections.
        </div>
      </div>
    </div>
  );
}
