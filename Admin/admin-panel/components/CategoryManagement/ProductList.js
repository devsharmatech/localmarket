'use client';

import { useEffect, useState } from 'react';

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [categoryMap, setCategoryMap] = useState(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedVendor, setSelectedVendor] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [deleting, setDeleting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [assigningCategories, setAssigningCategories] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [saving, setSaving] = useState(false);
    const [viewingImage, setViewingImage] = useState(null);
    const itemsPerPage = 50;

    useEffect(() => {
        // Load categories, vendors, then products
        const init = async () => {
            await loadCategories();
            await loadVendors();
            await loadProducts();
        };
        init();
    }, []);

    useEffect(() => {
        // Reload products when filters change (but not on initial load)
        if (categories.length > 0 || categoryMap.size > 0) {
            loadProducts();
        }
    }, [searchQuery, selectedCategory, currentPage]);

    const loadCategories = async () => {
        try {
            const res = await fetch('/api/categories', { cache: 'no-store' });
            const data = await res.json().catch(() => ({}));
            if (res.ok && Array.isArray(data?.categories)) {
                setCategories(data.categories);
                // Create a map for faster lookup
                const map = new Map();
                data.categories.forEach(cat => {
                    if (cat.id) {
                        // Store both UUID and name for lookup
                        map.set(cat.id, cat.name);
                        // Also store by name (case-insensitive) in case we need it
                        if (cat.name) {
                            map.set(cat.name.toLowerCase().trim(), cat.id);
                        }
                    }
                });
                setCategoryMap(map);
                console.log(`Loaded ${data.categories.length} categories, map size: ${map.size}`);
            } else {
                console.error('Failed to load categories:', data);
            }
        } catch (e) {
            console.error('Error loading categories:', e);
        }
    };

    const loadVendors = async () => {
        try {
            const res = await fetch('/api/vendors?status=Active&limit=1000', { cache: 'no-store' });
            const data = await res.json().catch(() => ({}));
            if (res.ok && Array.isArray(data?.vendors)) {
                setVendors(data.vendors);
            }
        } catch (e) {
            console.error('Error loading vendors:', e);
        }
    };

    const loadProducts = async () => {
        try {
            setLoading(true);
            setError('');
            const params = new URLSearchParams();
            if (searchQuery) params.set('q', searchQuery);
            if (selectedCategory) params.set('categoryId', selectedCategory);
            params.set('limit', itemsPerPage.toString());
            params.set('offset', ((currentPage - 1) * itemsPerPage).toString());

            // Load master products for management
            const res = await fetch(`/api/master-products?${params.toString()}`, { cache: 'no-store' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || 'Failed to load products');

            const productsList = Array.isArray(data?.products) ? data.products : [];
            setProducts(productsList);

            // Debug: Log products with vendor names
            if (productsList.length > 0) {
                console.log(`Loaded ${productsList.length} vendor products`);
                if (productsList.length > 0) {
                    console.log('Sample products:', productsList.slice(0, 3).map(p => ({ name: p.name, vendor: p.vendor_name, price: p.price })));
                }
            }

            // Reload categories if not loaded yet (in case products loaded first)
            if (categories.length === 0 && productsList.length > 0) {
                await loadCategories();
            }
        } catch (e) {
            setError(e?.message || 'Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const getCategoryName = (product) => {
        const categoryId = product.category_id;
        if (!categoryId) {
            return '-';
        }

        // Try map first (faster lookup)
        if (categoryMap.size > 0) {
            const name = categoryMap.get(categoryId);
            if (name && typeof name === 'string') {
                return name;
            }
        }

        // Fallback to array search
        if (categories.length > 0) {
            const category = categories.find(c => {
                // Try exact match first
                if (c.id === categoryId) return true;
                // Try string comparison (in case of type mismatch)
                if (String(c.id) === String(categoryId)) return true;
                return false;
            });
            if (category?.name) {
                return category.name;
            }
        }

        // If still not found, show partial UUID for debugging
        const displayId = categoryId.length > 8 ? `${categoryId.substring(0, 8)}...` : categoryId;
        console.warn(`Category not found for product "${product.name}", category_id: ${categoryId}`);
        return displayId;
    };

    const handleDeleteProduct = async (productId) => {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            setDeletingId(productId);
            const res = await fetch(`/api/master-products?id=${productId}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) throw new Error(data?.error || 'Failed to delete product');

            // Reload products
            await loadProducts();
            alert('Product deleted successfully');
        } catch (e) {
            alert(`Failed to delete product: ${e.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteAll = async () => {
        const count = products.length;
        if (!confirm(`Are you sure you want to delete ALL ${count} products? This action cannot be undone!`)) {
            return;
        }

        try {
            setDeleting(true);
            const res = await fetch('/api/master-products?deleteAll=true', { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) throw new Error(data?.error || 'Failed to delete all products');

            // Reload products
            await loadProducts();
            alert(`Successfully deleted ${count} products`);
        } catch (e) {
            alert(`Failed to delete all products: ${e.message}`);
        } finally {
            setDeleting(false);
        }
    };

    const handleAssignCategories = async () => {
        const productsWithoutCategories = products.filter(p => !p.category_id).length;
        if (productsWithoutCategories === 0) {
            alert('All products already have categories assigned!');
            return;
        }

        if (!confirm(`Assign categories to ${productsWithoutCategories} products without categories? This will try to match products to categories based on product names.`)) {
            return;
        }

        try {
            setAssigningCategories(true);
            const res = await fetch('/api/master-products/assign-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignAll: true }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) throw new Error(data?.error || 'Failed to assign categories');

            // Reload products and categories
            await loadCategories();
            await loadProducts();
            alert(data.message || `Successfully assigned categories to ${data.updated || 0} products`);
        } catch (e) {
            alert(`Failed to assign categories: ${e.message}`);
        } finally {
            setAssigningCategories(false);
        }
    };

    const handleEditProduct = (product) => {
        setEditingProduct({ ...product });
    };

    const handleSaveProduct = async () => {
        if (!editingProduct.name?.trim()) {
            alert('Product name is required');
            return;
        }

        try {
            setSaving(true);
            const res = await fetch(`/api/master-products?id=${editingProduct.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingProduct.name,
                    brand: editingProduct.brand || null,
                    uom: editingProduct.uom || null,
                    default_mrp: editingProduct.default_mrp ? parseFloat(editingProduct.default_mrp) : null,
                    category_id: editingProduct.category_id || null,
                    image_url: editingProduct.image_url || null,
                }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) throw new Error(data?.error || 'Failed to update product');

            // Reload products
            await loadProducts();
            setEditingProduct(null);
            alert('Product updated successfully');
        } catch (e) {
            alert(`Failed to update product: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                    <div className="font-semibold">Error</div>
                    <div className="text-sm mt-1">{error}</div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Master Products ({products.length})</h2>
                        <p className="text-sm text-gray-600 mt-1">View and manage all master products</p>
                    </div>
                    <div className="flex gap-2">
                        {products.length > 0 && (
                            <>
                                <button
                                    onClick={async () => {
                                        try {
                                            const params = new URLSearchParams();
                                            if (selectedCategory) params.set('categoryId', selectedCategory);
                                            if (searchQuery) params.set('q', searchQuery);
                                            const res = await fetch(`/api/master-products/export?${params.toString()}`, { cache: 'no-store' });
                                            if (!res.ok) throw new Error('Failed to export');
                                            const blob = await res.blob();
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`;
                                            document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                            URL.revokeObjectURL(url);
                                        } catch (e) {
                                            alert(`Failed to export: ${e.message}`);
                                        }
                                    }}
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    📥 Export Products
                                </button>
                                <button
                                    onClick={handleDeleteAll}
                                    disabled={deleting}
                                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleting ? 'Deleting...' : '🗑️ Delete All'}
                                </button>
                            </>
                        )}
                        <button
                            onClick={async () => {
                                await loadCategories();
                                await loadProducts();
                            }}
                            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search by product name..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-6 text-center text-gray-600">Loading products...</div>
                ) : products.length === 0 ? (
                    <div className="p-6 text-center text-gray-600">
                        {searchQuery || selectedCategory ? 'No products found matching your filters.' : 'No products found. Import products to get started.'}
                    </div>
                ) : (
                    <>
                        {products.filter(p => !p.category_id).length > 0 && (
                            <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex justify-between items-center">
                                <p className="text-sm text-yellow-800">
                                    <strong>Note:</strong> {products.filter(p => !p.category_id).length} products don't have categories assigned.
                                </p>
                                <button
                                    onClick={handleAssignCategories}
                                    disabled={assigningCategories || categories.length === 0}
                                    className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {assigningCategories ? 'Assigning...' : '🔗 Auto-Assign Categories'}
                                </button>
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UOM</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default MRP</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="relative w-16 h-16">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                if (e.target.nextSibling) {
                                                                    e.target.nextSibling.style.display = 'flex';
                                                                }
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className={`image-placeholder w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}
                                                    >
                                                        <span className="text-gray-400 text-xs">No Image</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">{product.brand || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">
                                                    {getCategoryName(product)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">{product.uom || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {product.default_mrp ? `₹${product.default_mrp}` : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleEditProduct(product)}
                                                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                        disabled={deletingId === product.id}
                                                        className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                                                    >
                                                        {deletingId === product.id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, products.length)} of {products.length} products
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    disabled={products.length < itemsPerPage}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Edit Product Modal */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Product</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                                <input
                                    type="text"
                                    value={editingProduct.name || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Enter product name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                                <input
                                    type="text"
                                    value={editingProduct.brand || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Enter brand name"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                    <select
                                        value={editingProduct.category_id || ''}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value || null })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                        <option value="">No Category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>{category.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit of Measure (UOM)</label>
                                    <input
                                        type="text"
                                        value={editingProduct.uom || ''}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, uom: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="e.g., kg, piece, litre"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Default MRP (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editingProduct.default_mrp || ''}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, default_mrp: e.target.value ? parseFloat(e.target.value) : null })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder="Enter default MRP"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image URL</label>
                                <div className="flex gap-3">
                                    <input
                                        type="url"
                                        value={editingProduct.image_url || ''}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    {editingProduct.image_url && (
                                        <img
                                            src={editingProduct.image_url}
                                            alt="Preview"
                                            className="w-16 h-16 object-cover rounded-lg border border-gray-300"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Enter a URL to an image of the product</p>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSaveProduct}
                                    disabled={saving}
                                    className="gradient-primary text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    onClick={() => setEditingProduct(null)}
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

            {/* Image View Modal */}
            {viewingImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                    onClick={() => setViewingImage(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setViewingImage(null)}
                            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
                            aria-label="Close"
                        >
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
                            <div className="p-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">{viewingImage.name}</h3>
                            </div>
                            <div className="flex items-center justify-center bg-gray-100 p-8">
                                <img
                                    src={viewingImage.url}
                                    alt={viewingImage.name}
                                    className="max-w-full max-h-[70vh] object-contain"
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EFailed to load image%3C/text%3E%3C/svg%3E';
                                    }}
                                />
                            </div>
                            <div className="p-4 border-t border-gray-200 flex justify-between items-center">
                                <a
                                    href={viewingImage.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                    Open in new tab
                                </a>
                                <button
                                    onClick={() => setViewingImage(null)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
