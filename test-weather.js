// Simple test script for weather service
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

async function testWeatherEndpoints() {
  console.log('Testing Weather Service Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing weather service health...');
    const healthResponse = await axios.get(`${API_BASE_URL}/weather/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test 2: Weather by city (without API key - should fail gracefully)
    console.log('\n2. Testing weather by city (expected to fail without API key)...');
    try {
      await axios.get(`${API_BASE_URL}/weather/current?city=Cape Town&state=Western Cape`);
    } catch (error) {
      if (error.response?.status === 500) {
        console.log('✅ Expected error for missing API key:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test 3: Cache stats (development only)
    console.log('\n3. Testing cache stats...');
    try {
      const cacheResponse = await axios.get(`${API_BASE_URL}/weather/cache/stats`);
      console.log('✅ Cache stats retrieved:', cacheResponse.data);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Cache stats blocked in production (expected)');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Weather service integration test completed!');
    console.log('\nNote: To fully test weather functionality, add a valid AIRVISUAL_API_KEY to your .env file');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWeatherEndpoints();