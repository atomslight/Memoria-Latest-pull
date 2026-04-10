/**
 * Test script to retry failed captions
 * Run with: node apps/backend/test-retry.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testRetryFailedCaptions() {
  try {
    // First, sign in to get a valid token
    console.log('🔐 Signing in...');
    const signInResponse = await axios.post(`${API_URL}/api/v1/auth/signin`, {
      email: 'manish@gmail.com',
      password: 'password123',
    });

    const token = signInResponse.data.session.access_token;
    console.log('✅ Signed in successfully');

    // Retry all failed captions
    console.log('\n🔄 Retrying all failed captions...');
    const retryResponse = await axios.post(
      `${API_URL}/api/v1/memories/retry-all-failed`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    console.log('✅ Response:', retryResponse.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testRetryFailedCaptions();
