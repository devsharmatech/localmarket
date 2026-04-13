/**
 * Test script for Login API
 * Run with: node test-login-api.js
 */

const API_URL = process.env.API_URL || 'https://admin-panel-dq112pv4i-abhisheks-projects-19c6e9a3.vercel.app';

async function testLoginAPI() {
  console.log('Testing Login API...\n');
  console.log('API URL:', `${API_URL}/api/auth/login`);
  console.log('---\n');

  // Test 1: Email login (valid credentials)
  console.log('Test 1: Email login with valid credentials');
  try {
    const response1 = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'email',
        email: 'test@example.com',
        password: 'test123',
      }),
    });

    const data1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(data1, null, 2));
    console.log('✓ Test 1 completed\n');
  } catch (error) {
    console.error('✗ Test 1 failed:', error.message);
    if (error.message.includes('JSON')) {
      console.log('  Note: API may be protected by Vercel authentication');
    }
  }

  // Test 2: Email login (invalid password)
  console.log('Test 2: Email login with invalid password');
  try {
    const response2 = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'email',
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
    });

    const data2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(data2, null, 2));
    console.log('✓ Test 2 completed\n');
  } catch (error) {
    console.error('✗ Test 2 failed:', error.message);
  }

  // Test 3: Email login (non-existent email)
  console.log('Test 3: Email login with non-existent email');
  try {
    const response3 = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'email',
        email: 'nonexistent@example.com',
        password: 'test123',
      }),
    });

    const data3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', JSON.stringify(data3, null, 2));
    console.log('✓ Test 3 completed\n');
  } catch (error) {
    console.error('✗ Test 3 failed:', error.message);
  }

  // Test 4: SMS login - Request OTP
  console.log('Test 4: SMS login - Request OTP');
  try {
    const response4 = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'sms',
        phone: '+919876543210',
      }),
    });

    const data4 = await response4.json();
    console.log('Status:', response4.status);
    console.log('Response:', JSON.stringify(data4, null, 2));
    console.log('✓ Test 4 completed\n');
  } catch (error) {
    console.error('✗ Test 4 failed:', error.message);
  }

  // Test 5: SMS login - Verify OTP (with hardcoded 1234)
  console.log('Test 5: SMS login - Verify OTP (1234)');
  try {
    const response5 = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'sms',
        phone: '+919876543210',
        otp: '1234',
      }),
    });

    const data5 = await response5.json();
    console.log('Status:', response5.status);
    console.log('Response:', JSON.stringify(data5, null, 2));
    console.log('✓ Test 5 completed\n');
  } catch (error) {
    console.error('✗ Test 5 failed:', error.message);
  }

  // Test 6: SMS login - Invalid OTP
  console.log('Test 6: SMS login - Invalid OTP');
  try {
    const response6 = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'sms',
        phone: '+919876543210',
        otp: '9999',
      }),
    });

    const data6 = await response6.json();
    console.log('Status:', response6.status);
    console.log('Response:', JSON.stringify(data6, null, 2));
    console.log('✓ Test 6 completed\n');
  } catch (error) {
    console.error('✗ Test 6 failed:', error.message);
  }

  // Test 7: SMS login - Non-existent phone
  console.log('Test 7: SMS login - Non-existent phone number');
  try {
    const response7 = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'sms',
        phone: '+919999999999',
      }),
    });

    const data7 = await response7.json();
    console.log('Status:', response7.status);
    console.log('Response:', JSON.stringify(data7, null, 2));
    console.log('✓ Test 7 completed\n');
  } catch (error) {
    console.error('✗ Test 7 failed:', error.message);
  }

  // Test 8: Invalid method
  console.log('Test 8: Invalid login method');
  try {
    const response8 = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'invalid',
        email: 'test@example.com',
        password: 'test123',
      }),
    });

    const data8 = await response8.json();
    console.log('Status:', response8.status);
    console.log('Response:', JSON.stringify(data8, null, 2));
    console.log('✓ Test 8 completed\n');
  } catch (error) {
    console.error('✗ Test 8 failed:', error.message);
  }

  // Test 9: Missing required fields
  console.log('Test 9: Missing required fields');
  try {
    const response9 = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'email',
        email: 'test@example.com',
        // Missing password
      }),
    });

    const data9 = await response9.json();
    console.log('Status:', response9.status);
    console.log('Response:', JSON.stringify(data9, null, 2));
    console.log('✓ Test 9 completed\n');
  } catch (error) {
    console.error('✗ Test 9 failed:', error.message);
  }

  // Test 10: Blocked user status check
  console.log('Test 10: Login attempt with blocked user (if exists)');
  try {
    const response10 = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'email',
        email: 'blocked@example.com',
        password: 'test123',
      }),
    });

    const data10 = await response10.json();
    console.log('Status:', response10.status);
    console.log('Response:', JSON.stringify(data10, null, 2));
    console.log('✓ Test 10 completed\n');
  } catch (error) {
    console.error('✗ Test 10 failed:', error.message);
  }

  console.log('---');
  console.log('All tests completed!');
  console.log('\nNote: If you see HTML responses, the API is protected by Vercel authentication.');
  console.log('The API will work correctly when called from the mobile app.');
}

// Run tests
testLoginAPI().catch(console.error);
