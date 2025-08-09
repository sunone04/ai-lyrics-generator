// 简单的网络连接测试
const https = require('https');

console.log('🔍 Testing network connectivity...');

// 测试基本的HTTPS连接
const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: '/v1beta/models',
  method: 'GET',
  headers: {
    'x-goog-api-key': 'AIzaSyDEVTHGnF9uv8Yi5xoZYDfIho3T0PFq32E'
  }
};

const req = https.request(options, (res) => {
  console.log('✅ Connection successful!');
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response length:', data.length);
    if (res.statusCode === 200) {
      console.log('🎉 API is accessible!');
    } else {
      console.log('⚠️ API returned error status:', res.statusCode);
      console.log('Response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Connection failed:', error.message);
  
  if (error.code === 'ENOTFOUND') {
    console.log('💡 DNS resolution failed. Check your internet connection.');
  } else if (error.code === 'ECONNREFUSED') {
    console.log('💡 Connection refused. Check firewall settings.');
  } else if (error.code === 'ETIMEDOUT') {
    console.log('💡 Connection timeout. Check network or proxy settings.');
  } else {
    console.log('💡 Network error details:', error);
  }
});

req.setTimeout(10000, () => {
  console.log('❌ Request timeout after 10 seconds');
  req.destroy();
});

req.end();