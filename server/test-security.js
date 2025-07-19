const axios = require('axios');

const testSecurity = async () => {
  const baseURL = 'http://localhost:5000';
  
  console.log('🔒 Testing security measures...\n');
  
  // First check if server is running
  try {
    await axios.get(`${baseURL}/api/auth/protected`);
    console.log('✅ Server is running and accessible\n');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ ERROR: Server is not running!');
      console.log('   Please start the server first: npm start\n');
      return;
    } else if (error.response?.status === 401) {
      console.log('✅ Server is running (got expected 401 for protected route)\n');
    } else {
      console.log(`⚠️ Server connection issue: ${error.message}\n`);
    }
  }
  
  const testCases = [
    // Test 1: Direct testcase access
    { 
      url: `${baseURL}/testcases/problem-1/input1.txt`,
      expectBlocked: true,
      description: 'Direct testcase file access'
    },
    
    // Test 2: Directory traversal
    {
      url: `${baseURL}/../testcases/problem-1/input1.txt`,
      expectBlocked: true,
      description: 'Directory traversal attempt'
    },
    
    // Test 3: Temp file access
    {
      url: `${baseURL}/temp/some-file.txt`,
      expectBlocked: true,
      description: 'Temporary file access'
    },
    
    // Test 4: Static file serving test
    {
      url: `${baseURL}/input1.txt`,
      expectBlocked: true,
      description: 'Generic .txt file access'
    },
    
    // Test 5: Testcase directory access
    {
      url: `${baseURL}/testcases/`,
      expectBlocked: true,
      description: 'Testcase directory listing'
    }
  ];
  
  for (const test of testCases) {
    try {
      console.log(`🧪 Testing: ${test.description}`);
      const response = await axios.get(test.url, { timeout: 5000 });
      
      if (test.expectBlocked) {
        console.log(`❌ SECURITY ISSUE: Request succeeded (should be blocked)`);
        console.log(`   Status: ${response.status}`);
        console.log(`   URL: ${test.url}`);
      } else {
        console.log(`✅ Working correctly`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ Server not running`);
        break;
      } else if (error.response) {
        // Got a response from server
        const status = error.response.status;
        if (test.expectBlocked && (status === 403 || status === 404 || status === 400)) {
          console.log(`✅ Properly blocked (Status: ${status})`);
        } else {
          console.log(`❓ Unexpected status: ${status}`);
        }
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
        console.log(`❌ Network error: ${error.message}`);
      } else {
        console.log(`❓ Unexpected error: ${error.message}`);
      }
    }
    console.log(''); // Empty line for readability
  }
  
  console.log('🔒 Security test completed!');
};

// Run the test
testSecurity().catch(console.error);