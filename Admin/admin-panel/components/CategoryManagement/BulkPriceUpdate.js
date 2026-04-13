'use client';

import { useEffect, useState } from 'react';

export default function BulkPriceUpdate() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [vendorId, setVendorId] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/vendors', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Failed to load vendors');
        if (!cancelled) setVendors(Array.isArray(data?.vendors) ? data.vendors : []);
      } catch (e) {
        if (!cancelled) setResult({ success: false, message: e?.message || 'Failed to load vendors' });
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!vendorId) {
      setResult({ success: false, message: 'Select a vendor first' });
      return;
    }
    setResult(null);
    const res = await fetch(`/api/vendor-products/template?vendorId=${encodeURIComponent(vendorId)}`, { cache: 'no-store' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setResult({ success: false, message: data?.error || 'Failed to download template' });
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendor_price_update_template.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!vendorId) {
      setResult({ success: false, message: 'Select a vendor first' });
      return;
    }
    if (!file) {
      setResult({ success: false, message: 'Please upload a file first' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('vendorId', vendorId);
      const res = await fetch('/api/vendor-products/bulk-price', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Import failed');

      setResult({ success: true, message: `Successfully updated ${data.updated || 0} product prices!` });
      setFile(null);
    } catch (error) {
      setResult({ success: false, message: 'Error importing prices: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Price Update via Excel</h2>
        <p className="text-gray-600 mb-6">
          Upload an Excel file to bulk update product prices. Download the template first to ensure correct format.
        </p>

        {/* Vendor selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Vendor</label>
          <select
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">-- Select Vendor --</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        {/* Download Template */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Download Template</h3>
              <p className="text-sm text-blue-700">Get the Excel template with correct format</p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              disabled={!vendorId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              📥 Download Template
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Excel File
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-500 transition">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-orange-600 hover:text-orange-500">
                  <span>Upload a file</span>
                  <input 
                    type="file" 
                    className="sr-only" 
                    accept=".xlsx,.xls" 
                    onChange={handleFileUpload} 
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">Excel (.xlsx, .xls) up to 10MB</p>
            </div>
          </div>
          {file && (
            <div className="mt-2 text-sm text-gray-600">
              Selected: <span className="font-medium">{file.name}</span>
            </div>
          )}
        </div>

        {/* Result Message */}
        {result && (
          <div className={`p-4 rounded-lg mb-6 ${
            result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {result.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={loading || !file || !vendorId}
            className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing...' : 'Import Prices'}
          </button>
          <button
            onClick={() => {
              setFile(null);
              setResult(null);
            }}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Instructions</h3>
        <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
          <li>Download the template Excel file first</li>
          <li>Fill in the "New Price" column with updated prices</li>
          <li>Keep "Product ID" and other columns unchanged</li>
          <li>Upload the completed file to update prices in bulk</li>
          <li>Review the preview table to check for any errors before importing</li>
        </ul>
      </div>
    </div>
  );
}
