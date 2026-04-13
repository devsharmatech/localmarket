'use client';

import { useState } from 'react';

export default function VendorImport() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileUpload = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
        }
    };

    const downloadTemplate = async () => {
        setResult(null);
        try {
            const res = await fetch('/api/vendors/template', { cache: 'no-store' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setResult({ success: false, message: data?.error || 'Failed to download template' });
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'vendors_template.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            setResult({ success: false, message: e?.message || 'Failed to download template' });
        }
    };

    const importVendors = async () => {
        if (!file) {
            setResult({ success: false, message: 'Please upload a file first' });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const form = new FormData();
            form.append('file', file);

            const res = await fetch('/api/vendors/import', { method: 'POST', body: form });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || 'Import failed');

            if (data?.success) {
                const inserted = data.inserted || 0;
                const updated = data.updated || 0;
                const total = data.total || (inserted + updated);
                let message = `Successfully imported ${total} vendors.`;
                if (inserted > 0 && updated > 0) {
                    message = `Imported ${inserted} new vendors and updated ${updated} existing vendors (${total} total).`;
                } else if (inserted > 0) {
                    message = `Imported ${inserted} new vendors.`;
                } else if (updated > 0) {
                    message = `Updated ${updated} existing vendors.`;
                } else {
                    message = `No vendors were imported or updated.`;
                }

                if (data?.errors && data.errors.length > 0) {
                    message += `\n\nErrors: ${data.errors.map(e => `Row ${e.row}: ${e.error}`).join(', ')}`;
                }

                setResult({ success: true, message, errors: data?.errors });
                setFile(null);
            } else {
                const errorMsg = data?.error || `Import failed: ${(data?.errors || []).length} row errors.`;
                setResult({ success: false, message: errorMsg, errors: data?.errors });
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
                <h2 className="text-xl font-bold text-gray-900 mb-4">Bulk Vendor Import</h2>
                <p className="text-gray-600 mb-6">
                    Upload an Excel/CSV file to bulk import vendors. The file should contain shop names, owner names, contact numbers, and location details. Download the template to see the required format.
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
                            <p className="text-xs text-gray-500">Excel (.xlsx, .xls) or CSV files</p>
                            {file && (
                                <p className="text-sm text-gray-900 mt-2">
                                    Selected: <span className="font-medium">{file.name}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={downloadTemplate}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                        📥 Download Template
                    </button>
                    <button
                        onClick={importVendors}
                        disabled={!file || loading}
                        className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Importing...' : '📤 Import Vendors'}
                    </button>
                </div>

                {/* Result */}
                {result && (
                    <div className={`mt-6 p-4 rounded-lg ${result.success
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                        <div className="font-semibold mb-2">
                            {result.success ? '✅ Success' : '❌ Error'}
                        </div>
                        <div className="text-sm whitespace-pre-line">{result.message}</div>
                        {result.errors && result.errors.length > 0 && (
                            <div className="mt-3 text-sm">
                                <div className="font-semibold mb-1">Row Errors:</div>
                                <ul className="list-disc list-inside space-y-1">
                                    {result.errors.slice(0, 10).map((error, idx) => (
                                        <li key={idx}>Row {error.row}: {error.error}</li>
                                    ))}
                                    {result.errors.length > 10 && (
                                        <li className="text-gray-600">... and {result.errors.length - 10} more errors</li>
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
