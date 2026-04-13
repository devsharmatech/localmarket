/**
 * Check product categories and verify category matching
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function checkProductCategories() {
  console.log('🔍 Checking Product Categories\n');
  console.log('─'.repeat(60));

  try {
    // Get all categories
    const categoriesRes = await fetch(`${API_BASE_URL}/api/categories`);
    const categoriesData = await categoriesRes.json();
    const categories = categoriesData.categories || [];
    
    console.log(`Found ${categories.length} categories:\n`);
    categories.forEach((cat, i) => {
      console.log(`${i + 1}. ${cat.name} (ID: ${cat.id})`);
    });

    // Get all products
    const productsRes = await fetch(`${API_BASE_URL}/api/master-products?limit=100`);
    const productsData = await productsRes.json();
    const products = productsData.products || [];
    
    console.log(`\n\nFound ${products.length} products:\n`);
    
    // Group products by category_id
    const productsByCategory = {};
    products.forEach(product => {
      const catId = product.category_id || 'null';
      if (!productsByCategory[catId]) {
        productsByCategory[catId] = [];
      }
      productsByCategory[catId].push(product);
    });

    // Show products grouped by category
    Object.keys(productsByCategory).forEach(catId => {
      const category = categories.find(c => c.id === catId);
      const categoryName = category ? category.name : `Unknown (${catId})`;
      console.log(`\n📦 ${categoryName}:`);
      console.log(`   Products: ${productsByCategory[catId].length}`);
      productsByCategory[catId].slice(0, 5).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}`);
      });
      if (productsByCategory[catId].length > 5) {
        console.log(`   ... and ${productsByCategory[catId].length - 5} more`);
      }
    });

    // Check for products without category_id
    const productsWithoutCategory = products.filter(p => !p.category_id);
    if (productsWithoutCategory.length > 0) {
      console.log(`\n⚠️  ${productsWithoutCategory.length} products without category_id:`);
      productsWithoutCategory.slice(0, 5).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}`);
      });
    }

    // Test category matching
    console.log('\n\n🧪 Testing Category Matching:\n');
    categories.slice(0, 3).forEach(category => {
      console.log(`Testing category: ${category.name}`);
      const productsInCategory = products.filter(p => p.category_id === category.id);
      console.log(`   Products with matching category_id: ${productsInCategory.length}`);
      
      // Test API call
      fetch(`${API_BASE_URL}/api/master-products?categoryId=${category.id}&limit=5`)
        .then(res => res.json())
        .then(data => {
          console.log(`   API returned: ${data.products?.length || 0} products`);
        })
        .catch(err => {
          console.error(`   API error: ${err.message}`);
        });
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

checkProductCategories();
