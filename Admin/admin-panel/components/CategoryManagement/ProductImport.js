'use client';

import { useEffect, useState } from 'react';

export default function ProductImport() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [importHistory, setImportHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadImportHistory();
  }, []);

  const loadImportHistory = async () => {
    try {
      setLoadingHistory(true);
      // Try API first
      const res = await fetch('/api/master-products/import-history?limit=10', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));

      if (res.ok && Array.isArray(data?.history)) {
        setImportHistory(data.history);
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem('productImportHistory');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setImportHistory(Array.isArray(parsed) ? parsed.slice(0, 10) : []);
          } catch (e) {
            setImportHistory([]);
          }
        }
      }
    } catch (e) {
      // Fallback to localStorage
      const stored = localStorage.getItem('productImportHistory');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setImportHistory(Array.isArray(parsed) ? parsed.slice(0, 10) : []);
        } catch (e) {
          setImportHistory([]);
        }
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveToLocalHistory = (importData) => {
    try {
      const stored = localStorage.getItem('productImportHistory');
      const history = stored ? JSON.parse(stored) : [];
      history.unshift({
        ...importData,
        created_at: new Date().toISOString(),
      });
      // Keep only last 50 imports
      const trimmed = history.slice(0, 50);
      localStorage.setItem('productImportHistory', JSON.stringify(trimmed));
      setImportHistory(trimmed.slice(0, 10));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const downloadTemplate = async () => {
    setResult(null);
    const res = await fetch('/api/master-products/template', { cache: 'no-store' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setResult({ success: false, message: data?.error || 'Failed to download template' });
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'master_products_template.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importProducts = async () => {
    if (!file) {
      setResult({ success: false, message: 'Please upload a file first' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/master-products/import', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Import failed');

      if (data?.success) {
        const inserted = data.inserted || 0;
        const updated = data.updated || 0;
        const total = data.total || (inserted + updated);
        let message = `Successfully imported ${total} master products.`;
        if (inserted > 0 && updated > 0) {
          message = `Imported ${inserted} new products and updated ${updated} existing products (${total} total).`;
        } else if (inserted > 0) {
          message = `Imported ${inserted} new products.`;
        } else if (updated > 0) {
          message = `Updated ${updated} existing products.`;
        } else {
          message = `No products were imported or updated.`;
        }

        // Add warnings if any categories couldn't be resolved
        if (data?.warnings && data.warnings.length > 0) {
          message += `\n\nWarning: ${data.warnings.join(' ')}`;
        }

        setResult({ success: true, message, warnings: data?.warnings, unresolvedCategories: data?.unresolvedCategories });

        // Save to import history
        const importData = {
          filename: file.name,
          inserted,
          updated,
          total,
          status: 'success',
        };

        // Try API first
        try {
          await fetch('/api/master-products/import-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(importData),
          }).catch(() => {
            // Fallback to localStorage
            saveToLocalHistory(importData);
          });
        } catch (e) {
          saveToLocalHistory(importData);
        }

        // Reload history
        await loadImportHistory();
        setFile(null);
      } else {
        const errorMsg = data?.error || `Import failed: ${(data?.errors || []).length} row errors.`;
        setResult({ success: false, message: errorMsg });

        // Save failed import to history
        const importData = {
          filename: file.name,
          inserted: 0,
          updated: 0,
          total: 0,
          status: 'failed',
          error: errorMsg,
        };
        saveToLocalHistory(importData);
        await loadImportHistory();
      }
    } catch (e) {
      setResult({ success: false, message: e?.message || 'Import failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Product Import</h2>
        <p className="text-gray-600 mb-6">
          Upload an Excel/CSV file to bulk import products. The file should contain product names, prices, categories, units, and image URLs. Category and Unit information must be included in the Excel file. Image URLs are optional but recommended.
        </p>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Excel/CSV File
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-500 transition">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-orange-600 hover:text-orange-500">
                  <span>Upload a file</span>
                  <input type="file" className="sr-only" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">Excel or CSV up to 10MB</p>
            </div>
          </div>
          {file && (
            <div className="mt-2 text-sm text-gray-600">
              Selected: <span className="font-medium">{file.name}</span>
            </div>
          )}
        </div>

        {result && (
          <div className="mb-6">
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {result.message.split('\n').map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
            {result.unresolvedCategories && result.unresolvedCategories.length > 0 && (
              <div className="mt-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 mb-2">Unresolved Categories:</p>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  {result.unresolvedCategories.map((item, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{item.product}</span>: Category "{item.categoryId}" not found
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-yellow-600 mt-2">
                  Tip: Make sure category names in your Excel file match exactly with category names in the system, or use category IDs.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={importProducts}
            disabled={loading || !file}
            className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Importing…' : 'Import Products'}
          </button>
          <button
            onClick={downloadTemplate}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Download Template
          </button>
        </div>
      </div>

      {/* Import History */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Recent Imports</h3>
          <button
            onClick={loadImportHistory}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Refresh
          </button>
        </div>
        {loadingHistory ? (
          <div className="text-sm text-gray-600 text-center py-4">Loading import history...</div>
        ) : importHistory.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">No import history yet. Import products to see history here.</div>
        ) : (
          <div className="space-y-3">
            {importHistory.map((importItem, idx) => {
              const date = importItem.created_at ? new Date(importItem.created_at) : new Date();
              const timeAgo = getTimeAgo(date);

              let statusText = 'Success';
              let statusColor = 'text-green-600';
              if (importItem.status === 'failed') {
                statusText = 'Failed';
                statusColor = 'text-red-600';
              }

              let detailText = '';
              if (importItem.inserted > 0 && importItem.updated > 0) {
                detailText = `Imported ${importItem.inserted} new, updated ${importItem.updated} existing (${importItem.total} total)`;
              } else if (importItem.inserted > 0) {
                detailText = `Imported ${importItem.inserted} products`;
              } else if (importItem.updated > 0) {
                detailText = `Updated ${importItem.updated} products`;
              } else {
                detailText = `No products imported`;
              }

              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{importItem.filename || 'import.xlsx'}</p>
                    <p className="text-xs text-gray-500">{detailText} • {timeAgo}</p>
                    {importItem.error && (
                      <p className="text-xs text-red-600 mt-1">{importItem.error}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



