/**
 * Test script for Register API
 * Run with: node test-register-api.js
 */

const API_URL = process.env.API_URL || 'https://admin-panel-dq112pv4i-abhisheks-projects-19c6e9a3.vercel.app';

async function testRegisterAPI() {
  console.log('Testing Register API...\n');
  console.log('API URL:', `${API_URL}/api/auth/register`);
  console.log('---\n');

  // Test 1: Valid registration with all fields
  console.log('Test 1: Valid registration with all fields');
  try {
    const response1 = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: 'Test User',
        phone: '9876543210',
        email: 'test@example.com',
        password: 'test123',
        state: 'Delhi',
        city: 'New Delhi',
      }),
    });

    const data1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(data1, null, 2));
    console.log('✓ Test 1 completed\n');
  } catch (error) {
    console.error('✗ Test 1 failed:', error.message);
  }

  // Test 2: Registration without email (phone only)
  console.log('Test 2: Registration without email (phone only)');
  try {
    const response2 = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: 'Test User 2',
        phone: '9876543211',
        password: 'test123',
        state: 'Maharashtra',
        city: 'Mumbai',
      }),
    });

    const data2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(data2, null, 2));
    console.log('✓ Test 2 completed\n');
  } catch (error) {
    console.error('✗ Test 2 failed:', error.message);
  }

  // Test 3: Invalid data (missing required fields)
  console.log('Test 3: Invalid data (missing required fields)');
  try {
    const response3 = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: '',
        phone: '123',
      }),
    });

    const data3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', JSON.stringify(data3, null, 2));
    console.log('✓ Test 3 completed\n');
  } catch (error) {
    console.error('✗ Test 3 failed:', error.message);
  }

  // Test 4: Duplicate phone number
  console.log('Test 4: Duplicate phone number (should fail)');
  try {
    const response4 = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: 'Duplicate User',
        phone: '9876543210', // Same as Test 1
        password: 'test123',
      }),
    });

    const data4 = await response4.json();
    console.log('Status:', response4.status);
    console.log('Response:', JSON.stringify(data4, null, 2));
    console.log('✓ Test 4 completed\n');
  } catch (error) {
    console.error('✗ Test 4 failed:', error.message);
  }

  // Test 5: Password too short
  console.log('Test 5: Password too short (should fail)');
  try {
    const response5 = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: 'Test User 5',
        phone: '9876543212',
        password: '123', // Too short
      }),
    });

    const data5 = await response5.json();
    console.log('Status:', response5.status);
    console.log('Response:', JSON.stringify(data5, null, 2));
    console.log('✓ Test 5 completed\n');
  } catch (error) {
    console.error('✗ Test 5 failed:', error.message);
  }

  console.log('---');
  console.log('All tests completed!');
}

// Run tests
testRegisterAPI().catch(console.error);
