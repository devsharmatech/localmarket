/**
 * Test script to verify products API works with category filtering
 * Run with: node scripts/test-products-by-category.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testProductsByCategory() {
  console.log('🧪 Testing Products API with Category Filtering\n');
  console.log('API Base URL:', API_BASE_URL);
  console.log('─'.repeat(60));

  try {
    // Step 1: Get all categories
    console.log('\n1️⃣ Fetching categories...');
    const categoriesRes = await fetch(`${API_BASE_URL}/api/categories`);
    const categoriesData = await categoriesRes.json();
    
    if (!categoriesData.categories || categoriesData.categories.length === 0) {
      console.error('❌ No categories found!');
      return;
    }
    
    console.log(`✅ Found ${categoriesData.categories.length} categories`);
    const firstCategory = categoriesData.categories[0];
    console.log(`   First category: ${firstCategory.name} (ID: ${firstCategory.id})`);

    // Step 2: Get products by category ID
    console.log(`\n2️⃣ Fetching products for category: ${firstCategory.name}...`);
    const productsByCategoryRes = await fetch(
      `${API_BASE_URL}/api/master-products?categoryId=${firstCategory.id}&limit=10`
    );
    const productsByCategoryData = await productsByCategoryRes.json();
    
    if (productsByCategoryRes.ok) {
      console.log(`✅ Found ${productsByCategoryData.products?.length || 0} products`);
      if (productsByCategoryData.products && productsByCategoryData.products.length > 0) {
        console.log('   Sample products:');
        productsByCategoryData.products.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.name} (Category ID: ${p.category_id})`);
        });
      } else {
        console.log('   ⚠️  No products found for this category');
      }
    } else {
      console.error('❌ Error:', productsByCategoryData.error || productsByCategoryRes.statusText);
    }

    // Step 3: Get products by query (category name)
    console.log(`\n3️⃣ Fetching products by query: "${firstCategory.name}"...`);
    const productsByQueryRes = await fetch(
      `${API_BASE_URL}/api/master-products?q=${encodeURIComponent(firstCategory.name)}&limit=10`
    );
    const productsByQueryData = await productsByQueryRes.json();
    
    if (productsByQueryRes.ok) {
      console.log(`✅ Found ${productsByQueryData.products?.length || 0} products`);
      if (productsByQueryData.products && productsByQueryData.products.length > 0) {
        console.log('   Sample products:');
        productsByQueryData.products.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.name}`);
        });
      } else {
        console.log('   ⚠️  No products found for this query');
      }
    } else {
      console.error('❌ Error:', productsByQueryData.error || productsByQueryRes.statusText);
    }

    // Step 4: Get all products (no filter)
    console.log(`\n4️⃣ Fetching all products (no filter)...`);
    const allProductsRes = await fetch(
      `${API_BASE_URL}/api/master-products?limit=10`
    );
    const allProductsData = await allProductsRes.json();
    
    if (allProductsRes.ok) {
      console.log(`✅ Found ${allProductsData.products?.length || 0} total products`);
      if (allProductsData.products && allProductsData.products.length > 0) {
        console.log('   Sample products:');
        allProductsData.products.slice(0, 3).forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.name} (Category ID: ${p.category_id || 'null'})`);
        });
      }
    } else {
      console.error('❌ Error:', allProductsData.error || allProductsRes.statusText);
    }

    // Summary
    console.log('\n' + '─'.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Categories: ${categoriesData.categories.length}`);
    console.log(`   Products by category ID: ${productsByCategoryData.products?.length || 0}`);
    console.log(`   Products by query: ${productsByQueryData.products?.length || 0}`);
    console.log(`   Total products: ${allProductsData.products?.length || 0}`);

    if (productsByCategoryData.products && productsByCategoryData.products.length > 0) {
      console.log('\n✅ API is working correctly! Products can be fetched by category.');
    } else {
      console.log('\n⚠️  No products found for category. This could mean:');
      console.log('   1. Products in the database don\'t have category_id set');
      console.log('   2. The category_id doesn\'t match any products');
      console.log('   3. There are no products in the database');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testProductsByCategory();
