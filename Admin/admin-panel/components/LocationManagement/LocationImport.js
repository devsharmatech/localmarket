'use client';

import { useState } from 'react';

export default function LocationImport({ onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await fetch('/api/locations/template');
      if (!res.ok) throw new Error('Failed to download template');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'locations_template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(`Failed to download template: ${error.message}`);
    }
  };

  const importLocations = async () => {
    if (!file) {
      setResult({ success: false, message: 'Please upload a file first' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/locations/import', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Import failed');

      if (data?.success) {
        const inserted = data.inserted || 0;
        const skipped = data.skipped || 0;
        const total = data.total || inserted;
        let message = `Successfully imported ${inserted} new locations.`;
        if (skipped > 0) {
          message += ` Skipped ${skipped} duplicate locations.`;
        }
        
        setResult({ 
          success: true, 
          message,
          inserted,
          skipped,
          total,
        });
        
        // Call success callback to refresh locations list
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        throw new Error(data?.error || 'Import failed');
      }
    } catch (e) {
      setResult({ 
        success: false, 
        message: e?.message || 'Failed to import locations',
        errors: e?.errors || [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Import Locations</h2>
      <p className="text-gray-600 mb-6">
        Upload an Excel/CSV file to bulk import locations. The file should contain State, City, Town, Tehsil, Sub-Tehsil, and optionally Circle columns.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Excel/CSV File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            disabled={loading}
          />
          {file && (
            <p className="text-sm text-gray-600 mt-2">Selected: {file.name}</p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            Download Template
          </button>
          <button
            onClick={importLocations}
            disabled={!file || loading}
            className="px-4 py-2 gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing...' : 'Import Locations'}
          </button>
        </div>

        {result && (
          <div
            className={`rounded-lg p-4 ${
              result.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="font-semibold mb-2">
              {result.success ? '✅ Import Successful' : '❌ Import Failed'}
            </div>
            <div className="text-sm">{result.message}</div>
            {result.success && (
              <div className="text-sm mt-2">
                <div>Inserted: {result.inserted || 0}</div>
                {result.skipped > 0 && <div>Skipped (duplicates): {result.skipped}</div>}
                <div>Total processed: {result.total || 0}</div>
              </div>
            )}
            {result.errors && result.errors.length > 0 && (
              <div className="mt-3">
                <div className="font-semibold mb-1">Errors:</div>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {result.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx}>
                      Row {err.row}: {err.error}
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-gray-600">
                      ... and {result.errors.length - 10} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
