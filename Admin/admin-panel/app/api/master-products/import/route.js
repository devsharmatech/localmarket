import * as XLSX from 'xlsx';
import { supabaseRestGet, supabaseRestInsert, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

function toStr(v) {
    return typeof v === 'string' ? v.trim() : '';
}

function toNum(v) {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

export async function POST(req) {
    try {
        const form = await req.formData();
        const file = form.get('file');

        if (!file || typeof file.arrayBuffer !== 'function') {
            return Response.json({ error: 'Missing file' }, { status: 400 });
        }

        const buf = Buffer.from(await file.arrayBuffer());
        const wb = XLSX.read(buf, { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const errors = [];
        const payload = [];

        rows.forEach((r, idx) => {
            const rowNo = idx + 2; // header row = 1
            const name = toStr(r['Product Name'] ?? r['name'] ?? r['Name'] ?? r['Product']);
            const brand = toStr(r['Brand'] ?? r['brand']);
            const uom = toStr(r['UOM'] ?? r['uom'] ?? r['Unit'] ?? r['unit']);
            const defaultMrp = toNum(r['Default MRP'] ?? r['default_mrp'] ?? r['MRP'] ?? r['mrp'] ?? r['Default M']);
            // Try multiple column name variations for image URL
            const imageUrl = toStr(
                r['Image URL'] ??
                r['image_url'] ??
                r['Image URL'] ??
                r['imageUrl'] ??
                r['Image'] ??
                r['image'] ??
                r['Image Url'] ??
                r['ImageUrl'] ??
                ''
            );
            // Try multiple column name variations for category
            const rowCategoryId = toStr(
                r['Category ID (optional)'] ??
                r['category_id'] ??
                r['Category'] ??
                r['category'] ??
                r['Category ID'] ??
                r['categoryId'] ??
                ''
            );
            // Use category from Excel file only
            const finalCategoryId = rowCategoryId || null;

            if (!name) {
                errors.push({ row: rowNo, error: 'Product Name is required' });
                return;
            }

            // category_id will be resolved to UUID later
            const productData = {
                name,
                brand: brand || null,
                uom: uom || null,
                default_mrp: defaultMrp,
                image_url: imageUrl || null,
                category_id: finalCategoryId, // Will be resolved to UUID after fetching categories
            };

            payload.push(productData);
        });

        if (payload.length === 0) {
            return Response.json({ error: 'No rows found in file' }, { status: 400 });
        }

        if (errors.length) {
            return Response.json({ success: false, errors, inserted: 0 }, { status: 400 });
        }

        // Build category mapping: name/id -> UUID
        const categoryMap = new Map();
        const categoryNameMap = new Map(); // For fuzzy name matching
        const categoryNormalizedMap = new Map(); // For normalized matching (no spaces/underscores)
        try {
            const categories = await supabaseRestGet('/rest/v1/categories?select=id,name');
            if (Array.isArray(categories)) {
                categories.forEach(cat => {
                    if (cat.id && cat.name) {
                        // Map by exact name (case-insensitive)
                        const nameKey = cat.name.toLowerCase().trim();
                        categoryMap.set(nameKey, cat.id);
                        categoryNameMap.set(nameKey, cat.id);

                        // Normalized version (remove spaces, underscores, special chars)
                        const normalizedName = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                        categoryNormalizedMap.set(normalizedName, cat.id);
                        categoryNameMap.set(normalizedName, cat.id);

                        // Map by ID if it's a text ID (for backward compatibility)
                        if (typeof cat.id === 'string' && !cat.id.includes('-')) {
                            categoryMap.set(cat.id.toLowerCase(), cat.id);
                        }
                    }
                });
            }
            console.log(`Loaded ${categories.length} categories, map size: ${categoryMap.size}`);
        } catch (e) {
            console.warn('Could not fetch categories:', e.message);
        }

        // Helper function to convert text ID to category name
        const textIdToName = (textId) => {
            // Convert "fresh_fruits" -> "Fresh Fruits"
            return textId
                .split(/[_\s-]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        // Resolve category IDs to UUIDs
        const unresolvedCategories = [];
        payload.forEach(prod => {
            if (prod.category_id) {
                const originalCategoryId = prod.category_id;
                const categoryKey = prod.category_id.toLowerCase().trim();
                let categoryUuid = null;

                // Try 1: Direct match (exact name)
                categoryUuid = categoryMap.get(categoryKey);

                // Try 2: Normalized match (remove all special chars)
                if (!categoryUuid) {
                    const normalized = categoryKey.replace(/[^a-z0-9]/g, '');
                    categoryUuid = categoryNormalizedMap.get(normalized);
                }

                // Try 3: Convert underscore format to name format and match
                if (!categoryUuid) {
                    const categoryName = textIdToName(categoryKey);
                    categoryUuid = categoryMap.get(categoryName.toLowerCase().trim());
                }

                // Try 4: Normalized version of converted name
                if (!categoryUuid) {
                    const categoryName = textIdToName(categoryKey);
                    const normalizedName = categoryName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    categoryUuid = categoryNormalizedMap.get(normalizedName);
                }

                // Try 5: Check if it's already a UUID
                if (!categoryUuid) {
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (uuidRegex.test(prod.category_id)) {
                        // It's already a UUID, verify it exists in categories
                        const categoryExists = Array.from(categoryMap.values()).includes(prod.category_id);
                        if (categoryExists) {
                            categoryUuid = prod.category_id;
                        }
                    }
                }

                // Try 6: Fuzzy match - find category that contains the key or vice versa
                if (!categoryUuid) {
                    const foundCategory = Array.from(categoryNameMap.entries()).find(([key]) => {
                        const normalizedKey = categoryKey.replace(/[^a-z0-9]/g, '');
                        const normalizedMapKey = key.replace(/[^a-z0-9]/g, '');
                        return key.includes(categoryKey) ||
                            categoryKey.includes(key) ||
                            normalizedMapKey.includes(normalizedKey) ||
                            normalizedKey.includes(normalizedMapKey);
                    });

                    if (foundCategory) {
                        categoryUuid = foundCategory[1];
                    }
                }

                if (categoryUuid) {
                    prod.category_id = categoryUuid;
                } else {
                    // Category doesn't exist - try to create it
                    unresolvedCategories.push({ product: prod.name, categoryId: originalCategoryId });

                    // Store for auto-creation
                    if (!prod._pendingCategory) {
                        prod._pendingCategory = originalCategoryId;
                    }
                    prod.category_id = null;
                }
            }
        });

        // Auto-create missing categories
        const categoriesToCreate = new Map();
        payload.forEach(prod => {
            if (prod._pendingCategory) {
                const categoryId = prod._pendingCategory.toLowerCase().trim();
                if (!categoriesToCreate.has(categoryId)) {
                    const categoryName = textIdToName(categoryId);
                    categoriesToCreate.set(categoryId, categoryName);
                }
            }
        });

        let createdCategories = new Map();
        if (categoriesToCreate.size > 0) {
            console.log(`Creating ${categoriesToCreate.size} missing categories...`);
            for (const [categoryId, categoryName] of categoriesToCreate.entries()) {
                try {
                    // Create the category
                    const newCategory = {
                        name: categoryName,
                        priority: 999, // Default priority
                        visible: true,
                        icon_name: categoryId.replace(/[^a-z0-9]/g, '_'),
                    };

                    const created = await supabaseRestInsert('/rest/v1/categories', [newCategory]);
                    const createdId = Array.isArray(created) ? (created[0]?.id || created[0]) : (created?.id || created);

                    if (createdId) {
                        createdCategories.set(categoryId, createdId);
                        // Update category maps for subsequent products
                        categoryMap.set(categoryName.toLowerCase().trim(), createdId);
                        const normalized = categoryId.replace(/[^a-z0-9]/g, '');
                        categoryNormalizedMap.set(normalized, createdId);
                        console.log(`Created category: ${categoryName} (${createdId})`);
                    }
                } catch (e) {
                    console.error(`Failed to create category ${categoryName}:`, e.message);
                    // If category already exists, try to fetch it
                    try {
                        const existing = await supabaseRestGet(`/rest/v1/categories?name=ilike.${encodeURIComponent(categoryName)}&select=id,name`);
                        if (Array.isArray(existing) && existing.length > 0) {
                            const existingId = existing[0].id;
                            createdCategories.set(categoryId, existingId);
                            categoryMap.set(categoryName.toLowerCase().trim(), existingId);
                            const normalized = categoryId.replace(/[^a-z0-9]/g, '');
                            categoryNormalizedMap.set(normalized, existingId);
                        }
                    } catch (fetchError) {
                        console.error(`Failed to fetch existing category ${categoryName}:`, fetchError.message);
                    }
                }
            }

            // Re-assign categories to products that had pending categories
            payload.forEach(prod => {
                if (prod._pendingCategory && !prod.category_id) {
                    const categoryId = prod._pendingCategory.toLowerCase().trim();
                    const createdUuid = createdCategories.get(categoryId);
                    if (createdUuid) {
                        prod.category_id = createdUuid;
                        // Remove from unresolved
                        const index = unresolvedCategories.findIndex(c => c.product === prod.name && c.categoryId === prod._pendingCategory);
                        if (index >= 0) {
                            unresolvedCategories.splice(index, 1);
                        }
                    }
                }
                // Clean up temporary field
                delete prod._pendingCategory;
            });
        }

        if (unresolvedCategories.length > 0) {
            const uniqueCategories = [...new Set(unresolvedCategories.map(c => c.categoryId))];
            console.warn(`Warning: ${unresolvedCategories.length} products have unresolved category IDs. Unique categories:`, uniqueCategories);
        }

        // Get existing products to check which ones need to be updated vs inserted
        // Match by name and category_id combination
        const existingProducts = new Map();
        try {
            const existing = await supabaseRestGet('/rest/v1/master_products?select=id,name,category_id');
            if (Array.isArray(existing)) {
                existing.forEach(prod => {
                    const key = `${prod.name.toLowerCase().trim()}_${prod.category_id || 'null'}`;
                    existingProducts.set(key, prod.id);
                });
            }
        } catch (e) {
            // If we can't fetch existing, proceed with inserts only
            console.warn('Could not fetch existing products:', e.message);
        }

        // Separate into inserts and updates
        const toInsert = [];
        const toUpdate = [];

        payload.forEach(prod => {
            const key = `${prod.name.toLowerCase().trim()}_${prod.category_id || 'null'}`;
            const existingId = existingProducts.get(key);

            if (existingId) {
                toUpdate.push({ ...prod, id: existingId });
            } else {
                toInsert.push(prod);
            }
        });

        let insertedCount = 0;
        let updatedCount = 0;

        // Insert new products
        if (toInsert.length > 0) {
            try {
                const insertResult = await supabaseRestInsert('/rest/v1/master_products', toInsert);
                insertedCount = Array.isArray(insertResult) ? insertResult.length : (insertResult ? 1 : 0);
            } catch (e) {
                console.error('Error inserting products:', e);
                // Return error details
                return Response.json({
                    success: false,
                    error: `Failed to insert products: ${e.message}`,
                    inserted: 0,
                    updated: 0,
                    errors: [{ message: e.message }]
                }, { status: 500 });
            }
        }

        // Update existing products
        if (toUpdate.length > 0) {
            try {
                // Update each product individually
                for (const prod of toUpdate) {
                    const { id, ...updateData } = prod;
                    await supabaseRestPatch(`/rest/v1/master_products?id=eq.${id}`, updateData);
                    updatedCount++;
                }
            } catch (e) {
                console.error('Error updating products:', e);
                // Return partial success
            }
        }

        // Log the import history (will be handled by frontend after response)

        const warnings = [];
        const createdCategoryCount = createdCategories.size;
        if (createdCategoryCount > 0) {
            const createdCategoryNames = Array.from(categoriesToCreate.values());
            warnings.push(`Created ${createdCategoryCount} new categories automatically: ${createdCategoryNames.join(', ')}.`);
        }
        if (unresolvedCategories.length > 0) {
            const uniqueCategories = [...new Set(unresolvedCategories.map(c => c.categoryId))];
            warnings.push(`${unresolvedCategories.length} products had unresolved categories: ${uniqueCategories.join(', ')}. These products were imported without categories.`);
        }

        return Response.json({
            success: true,
            inserted: insertedCount,
            updated: updatedCount,
            total: insertedCount + updatedCount,
            errors: [],
            warnings: warnings.length > 0 ? warnings : undefined,
            unresolvedCategories: unresolvedCategories.length > 0 ? unresolvedCategories.slice(0, 10) : undefined,
            createdCategories: createdCategoryCount > 0 ? Array.from(categoriesToCreate.values()) : undefined,
        });
    } catch (e) {
        return Response.json({ error: e?.message || 'Import failed' }, { status: 500 });
    }
}

