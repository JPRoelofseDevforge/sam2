const fetch = require('node-fetch');

async function testAuth() {
  try {
    // Test login endpoint
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'qwe12345_'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Login successful!');
      console.log('Token:', data.token);
      console.log('User:', data.user);
    } else {
      console.log('Login failed:', response.status, response.statusText);
      const text = await response.text();
      console.log('Response:', text);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth();