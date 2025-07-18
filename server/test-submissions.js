require('dotenv').config();
const { evaluateSubmission } = require('./utils/evaluateSubmission');
const db = require('./config/db');

const testSubmission = async () => {
  try {
    console.log('🧪 Testing submission evaluation...');
    
    // Check available problems
    const [problems] = await db.execute('SELECT id, title FROM problems');
    console.log('Available problems:', problems);
    
    // Check testcase files
    const fs = require('fs');
    const path = require('path');
    
    for (const problem of problems) {
      const testcaseDir = path.join(__dirname, 'testcases', `problem-${problem.id}`);
      console.log(`\n📁 Checking ${testcaseDir}:`);
      
      if (fs.existsSync(testcaseDir)) {
        const files = fs.readdirSync(testcaseDir);
        console.log(`  Files: ${files.join(', ')}`);
      } else {
        console.log(`  ❌ Directory does not exist`);
      }
    }
    
    // Test with a simple sum program
    const testCode = `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`;

    console.log('\n🏃 Running test submission...');
    const result = await evaluateSubmission({
      code: testCode,
      language: 'cpp',
      username: localStorage.getItem('username') || 'test_user',
      problemId: 1
    });
    
    console.log('📊 Test result:', result);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
};

testSubmission();