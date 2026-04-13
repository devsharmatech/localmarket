import { supabaseRestGet, supabaseRestPatch } from '@/lib/supabaseAdminFetch';

function toStr(v) {
  return typeof v === 'string' ? v.trim() : '';
}

// POST - Assign categories to products based on product name patterns
export async function POST(req) {
  try {
    const body = await req.json();
    const { assignAll } = body;

    // Get all products without categories
    const productsWithoutCategories = await supabaseRestGet('/rest/v1/master_products?category_id=is.null&select=id,name');
    
    if (!Array.isArray(productsWithoutCategories) || productsWithoutCategories.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'All products already have categories assigned',
        updated: 0 
      }, { status: 200 });
    }

    // Get all categories
    const categories = await supabaseRestGet('/rest/v1/categories?select=id,name');
    if (!Array.isArray(categories) || categories.length === 0) {
      return Response.json({ error: 'No categories found. Please import categories first.' }, { status: 400 });
    }

    // Build category mapping by keywords
    const categoryKeywords = {
      'fruits': ['fruit', 'apple', 'banana', 'orange', 'mango', 'grapes', 'guava', 'papaya', 'watermelon'],
      'vegetables': ['vegetable', 'tomato', 'onion', 'potato', 'carrot', 'capsicum', 'cabbage', 'cauliflower'],
      'dairy': ['milk', 'curd', 'yogurt', 'cheese', 'butter', 'ghee', 'paneer', 'cream'],
      'bakery': ['bread', 'bun', 'cake', 'pastry', 'biscuit', 'cookie', 'rusk', 'khari'],
      'beverages': ['tea', 'coffee', 'juice', 'drink', 'soda', 'cola'],
      'snacks': ['snack', 'namkeen', 'chips', 'wafers', 'nuts', 'dry fruit'],
      'spices': ['spice', 'masala', 'turmeric', 'chilli', 'coriander', 'cumin', 'garam'],
      'grains': ['rice', 'wheat', 'atta', 'dal', 'pulse', 'flour', 'maida'],
      'oil': ['oil', 'ghee'],
    };

    // Create category name to UUID map
    const categoryMap = new Map();
    categories.forEach(cat => {
      if (cat.id && cat.name) {
        categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
        // Also map variations
        const normalized = cat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        categoryMap.set(normalized, cat.id);
      }
    });

    let updatedCount = 0;
    const updates = [];

    // Try to assign categories based on product name keywords
    productsWithoutCategories.forEach(product => {
      if (!product.name) return;

      const productName = product.name.toLowerCase();
      let assignedCategoryId = null;

      // Try keyword matching
      for (const [categoryType, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => productName.includes(keyword))) {
          // Find matching category
          const matchingCategory = categories.find(cat => {
            const catName = cat.name.toLowerCase();
            return catName.includes(categoryType) || 
                   categoryType.includes(catName.replace(/[^a-z0-9]/g, ''));
          });
          
          if (matchingCategory) {
            assignedCategoryId = matchingCategory.id;
            break;
          }
        }
      }

      // If still not found, try direct name matching
      if (!assignedCategoryId) {
        // Try to match category names in product name
        for (const category of categories) {
          const catNameWords = category.name.toLowerCase().split(/\s+/);
          if (catNameWords.some(word => word.length > 3 && productName.includes(word))) {
            assignedCategoryId = category.id;
            break;
          }
        }
      }

      if (assignedCategoryId) {
        updates.push({
          id: product.id,
          category_id: assignedCategoryId,
        });
      }
    });

    // Update products in batches
    if (updates.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        for (const update of batch) {
          try {
            await supabaseRestPatch(`/rest/v1/master_products?id=eq.${update.id}`, {
              category_id: update.category_id,
            });
            updatedCount++;
          } catch (e) {
            console.error(`Error updating product ${update.id}:`, e);
          }
        }
      }
    }

    return Response.json({
      success: true,
      updated: updatedCount,
      total: productsWithoutCategories.length,
      message: `Assigned categories to ${updatedCount} out of ${productsWithoutCategories.length} products`,
    }, { status: 200 });
  } catch (e) {
    return Response.json({ error: e?.message || 'Failed to assign categories' }, { status: 500 });
  }
}
