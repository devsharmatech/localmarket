'use client';

import { useEffect, useState, useRef } from 'react';

export default function CategoryMaster() {
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', subCategories: [], icon_url: '', image_url: '' });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
   const [iconPreview, setIconPreview] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const iconFileInputRef = useRef(null);
  const imageFileInputRef = useRef(null);
  const editIconFileInputRef = useRef(null);
  const editImageFileInputRef = useRef(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/categories', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Failed to load categories');
      } else {
        if (data.warning === 'offline_mode') {
          setError('Viewing offline data: Database unreachable');
        }
        const cats = Array.isArray(data?.categories) ? data.categories : [];
        // Mark top 8 by priority (lowest numbers)
        const sorted = [...cats].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
        const topIds = new Set(sorted.slice(0, 8).map(c => c.id));
        setCategories(cats.map(c => ({ ...c, isTop8: topIds.has(c.id), subCategories: c.subCategories || [] })));
      }
    } catch (e) {
      setError(e?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await loadCategories();
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const downloadTemplate = async () => {
    setImportResult(null);
    try {
      const res = await fetch('/api/categories/template', { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setImportResult({ success: false, message: data?.error || 'Failed to download template' });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'categories_template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setImportResult({ success: false, message: e?.message || 'Failed to download template' });
    }
  };

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setImportFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setImportResult({ success: false, message: 'Please upload a file first' });
      return;
    }
    setImportLoading(true);
    setImportResult(null);
    try {
      const form = new FormData();
      form.append('file', importFile);

      const res = await fetch('/api/categories/import', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Import failed');

      if (data?.success) {
        setImportResult({
          success: true,
          message: `Successfully imported ${data.inserted || 0} categories.`
        });
        setImportFile(null);
        setIsImporting(false);
        // Reload categories
        await loadCategories();
      } else {
        const errorMsg = data.errors && data.errors.length > 0
          ? `Import failed: ${data.errors.length} row(s) have errors. ${data.errors.map(e => `Row ${e.row}: ${e.error}`).join(', ')}`
          : 'Import failed';
        setImportResult({ success: false, message: errorMsg });
      }
    } catch (e) {
      setImportResult({ success: false, message: e?.message || 'Import failed' });
    } finally {
      setImportLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory({ ...category });
    // Set icon preview - handle both URL and base64 data
    if (category.icon_url) {
      setIconPreview(category.icon_url);
    } else {
      setIconPreview(null);
    }
    if (category.image_url) {
      setImagePreview(category.image_url);
    } else {
      setImagePreview(null);
    }
  };

  const handleIconUpload = async (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'general');
      formData.append('folder', 'category-icons');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      if (isEdit && editingCategory) {
        setEditingCategory({ ...editingCategory, icon_url: data.url });
      } else {
        setNewCategory({ ...newCategory, icon_url: data.url });
      }
      setIconPreview(data.url);
    } catch (err) {
      alert(`Icon upload failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'general');
      formData.append('folder', 'category-images');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      if (isEdit && editingCategory) {
        setEditingCategory({ ...editingCategory, image_url: data.url });
      } else {
        setNewCategory({ ...newCategory, image_url: data.url });
      }
      setImagePreview(data.url);
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategory.name?.trim()) {
      alert('Category name is required');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/categories?id=${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCategory.name,
          priority: editingCategory.priority || 999,
          visible: editingCategory.visible !== undefined ? editingCategory.visible : true,
          icon_name: editingCategory.icon_name || null,
          icon_url: editingCategory.icon_url || null,
          image_url: editingCategory.image_url || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Failed to update category');
        return;
      }

      if (data.warning) {
        alert('Action pending: ' + data.warning);
        return;
      }
      await loadCategories();
      setEditingCategory(null);
      setIconPreview(null);
      setImagePreview(null);
      alert('Category updated successfully');
    } catch (e) {
      alert(`Failed to update category: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category? Products assigned to this category will lose their category assignment.')) {
      return;
    }

    try {
      setDeletingId(categoryId);
      const res = await fetch(`/api/categories?id=${categoryId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Failed to delete category');
        return;
      }

      if (data.warning) {
        alert('Action pending: ' + data.warning);
        return;
      }
      await loadCategories();
      alert('Category deleted successfully');
    } catch (e) {
      alert(`Failed to delete category: ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <div className="font-semibold">Category API error</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      )}

      {/* Header Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Categories ({categories.length})</h2>
          <p className="text-sm text-gray-600 mt-1">Top 8 Priority Categories + {categories.length - 8} Additional Categories</p>
        </div>
        <div className="flex gap-3">
          {categories.length > 0 && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/categories/export', { cache: 'no-store' });
                  if (!res.ok) throw new Error('Failed to export');
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `categories_export_${new Date().toISOString().split('T')[0]}.xlsx`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch (e) {
                  alert(`Failed to export: ${e.message}`);
                }
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              📥 Export Categories
            </button>
          )}
          <button
            onClick={() => setIsImporting(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            📥 Import Categories
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition"
          >
            + Create Category
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 text-gray-700">
          Loading categories…
        </div>
      )}

      {/* Import Categories Form */}
      {isImporting && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Import Categories</h3>
          <p className="text-gray-600 mb-6">
            Upload an Excel/CSV file to bulk import categories. The file should contain category names, IDs, priorities, and visibility settings.
          </p>

          {importResult && (
            <div className={`mb-4 p-4 rounded-lg ${importResult.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
              <div className="font-semibold">{importResult.success ? 'Success' : 'Error'}</div>
              <div className="text-sm mt-1">{importResult.message}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Excel/CSV File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {importFile && (
                <p className="text-sm text-gray-600 mt-2">Selected: {importFile.name}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadTemplate}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                📄 Download Template
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || importLoading}
                className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importLoading ? 'Importing...' : 'Import Categories'}
              </button>
              <button
                onClick={() => {
                  setIsImporting(false);
                  setImportFile(null);
                  setImportResult(null);
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Category Form */}
      {isCreating && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Category</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter category name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Icon</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    ref={iconFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleIconUpload(e, false)}
                    className="hidden"
                    id="category-icon-upload"
                  />
                  <label
                    htmlFor="category-icon-upload"
                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition text-sm font-medium"
                  >
                    Upload Image
                  </label>
                  <span className="text-sm text-gray-500 self-center">or</span>
                  <input
                    type="url"
                    value={newCategory.icon_url && !newCategory.icon_url.startsWith('data:') ? newCategory.icon_url : ''}
                    onChange={(e) => {
                      setNewCategory({ ...newCategory, icon_url: e.target.value });
                      if (e.target.value) setIconPreview(e.target.value);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter icon image URL..."
                  />
                </div>
                {iconPreview && (
                  <div className="mt-2">
                    <img
                      src={iconPreview}
                      alt="Icon preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategory({ ...newCategory, icon_url: '' });
                        setIconPreview(null);
                        if (iconFileInputRef.current) iconFileInputRef.current.value = '';
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Banner Image</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="hidden"
                    id="category-image-upload"
                  />
                  <label
                    htmlFor="category-image-upload"
                    className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition text-sm font-medium"
                  >
                    Upload Banner
                  </label>
                  <span className="text-sm text-gray-500 self-center">or</span>
                  <input
                    type="url"
                    value={newCategory.image_url && !newCategory.image_url.startsWith('data:') ? newCategory.image_url : ''}
                    onChange={(e) => {
                      setNewCategory({ ...newCategory, image_url: e.target.value });
                      if (e.target.value) setImagePreview(e.target.value);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter banner image URL..."
                  />
                </div>
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Banner preview"
                      className="w-full max-h-40 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategory({ ...newCategory, image_url: '' });
                        setImagePreview(null);
                        if (imageFileInputRef.current) imageFileInputRef.current.value = '';
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove Banner
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!newCategory.name?.trim()) {
                    alert('Category name is required');
                    return;
                  }
                  try {
                    setSaving(true);
                    const res = await fetch('/api/categories', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: newCategory.name,
                        priority: 999,
                        visible: true,
                        icon_url: newCategory.icon_url || null,
                        image_url: newCategory.image_url || null,
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(data?.error || 'Failed to create category');
                    await loadCategories();
                    setIsCreating(false);
                    setNewCategory({ name: '', subCategories: [], icon_url: '', image_url: '' });
                    setIconPreview(null);
                    setImagePreview(null);
                    alert('Category created successfully');
                  } catch (e) {
                    alert(`Failed to create category: ${e.message}`);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewCategory({ name: '', subCategories: [], icon_url: '', image_url: '' });
                  setIconPreview(null);
                  setImagePreview(null);
                }}
                disabled={saving}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sample Products</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visibility</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-600">
                  No categories found.
                </td>
              </tr>
            )}
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {category.icon_url && (
                      <img
                        src={category.icon_url}
                        alt={category.name}
                        className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    {category.image_url && (
                        <img
                          src={category.image_url}
                          alt={`${category.name} Banner`}
                          className="w-16 h-10 object-cover rounded-md border border-gray-200"
                          title="Banner Image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    <div className="flex items-center gap-2">
                      {category.isTop8 && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">
                          Top 8
                        </span>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        <div className="text-xs text-gray-500">ID: {category.id}</div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">#{category.priority}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                    {category.productCount} items
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {category.subCategories.slice(0, 3).map((sub, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {sub}
                      </span>
                    ))}
                    {category.subCategories.length > 3 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                        +{category.subCategories.length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={category.visible}
                      className="sr-only peer"
                      readOnly
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${category.visible ? 'bg-orange-600' : 'bg-gray-200'
                      }`}>
                      <div className={`h-5 w-5 bg-white border border-gray-300 rounded-full transition-transform ${category.visible ? 'translate-x-5' : 'translate-x-0'
                        }`} style={{ marginTop: '2px', marginLeft: '2px' }}></div>
                    </div>
                  </label>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={deletingId === category.id}
                      className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                    >
                      {deletingId === category.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Name *</label>
                <input
                  type="text"
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <input
                  type="number"
                  value={editingCategory.priority || 999}
                  onChange={(e) => setEditingCategory({ ...editingCategory, priority: parseInt(e.target.value) || 999 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter priority (lower = higher priority)"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first. Default: 999</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon Name</label>
                <input
                  type="text"
                  value={editingCategory.icon_name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, icon_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter icon name (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon Image</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      ref={editIconFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleIconUpload(e, true)}
                      className="hidden"
                      id="edit-category-icon-upload"
                    />
                    <label
                      htmlFor="edit-category-icon-upload"
                      className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition text-sm font-medium"
                    >
                      Upload Image
                    </label>
                    <span className="text-sm text-gray-500 self-center">or</span>
                    <input
                      type="url"
                      value={editingCategory.icon_url && !editingCategory.icon_url.startsWith('data:') ? editingCategory.icon_url : ''}
                      onChange={(e) => {
                        setEditingCategory({ ...editingCategory, icon_url: e.target.value });
                        if (e.target.value) setIconPreview(e.target.value);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter icon image URL..."
                    />
                  </div>
                  {iconPreview && (
                    <div className="mt-2">
                      <img
                        src={iconPreview}
                        alt="Icon preview"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory({ ...editingCategory, icon_url: '' });
                          setIconPreview(null);
                          if (editIconFileInputRef.current) editIconFileInputRef.current.value = '';
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Banner Image</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      ref={editImageFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      className="hidden"
                      id="edit-category-image-upload"
                    />
                    <label
                      htmlFor="edit-category-image-upload"
                      className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition text-sm font-medium"
                    >
                      Upload Banner
                    </label>
                    <span className="text-sm text-gray-500 self-center">or</span>
                    <input
                      type="url"
                      value={editingCategory.image_url && !editingCategory.image_url.startsWith('data:') ? editingCategory.image_url : ''}
                      onChange={(e) => {
                        setEditingCategory({ ...editingCategory, image_url: e.target.value });
                        if (e.target.value) setImagePreview(e.target.value);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter banner image URL..."
                    />
                  </div>
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Banner preview"
                        className="w-full max-h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory({ ...editingCategory, image_url: '' });
                          setImagePreview(null);
                          if (editImageFileInputRef.current) editImageFileInputRef.current.value = '';
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Banner
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="visible"
                  checked={editingCategory.visible !== undefined ? editingCategory.visible : true}
                  onChange={(e) => setEditingCategory({ ...editingCategory, visible: e.target.checked })}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="visible" className="ml-2 block text-sm text-gray-700">
                  Visible
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveCategory}
                  disabled={saving}
                  className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setIconPreview(null);
                    setImagePreview(null);
                  }}
                  disabled={saving}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



