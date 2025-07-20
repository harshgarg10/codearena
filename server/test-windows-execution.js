require('dotenv').config();
const { executeCode } = require('./utils/codeExecuter');
const os = require('os');

const testCodes = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,
  
  python: `a, b = map(int, input().split())
print(a + b)`,
  
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
        sc.close();
    }
}`
};

async function testWindowsExecution() {
  console.log(`🧪 Testing code execution on ${os.platform()} ${os.arch()}...\n`);
  
  for (const [language, code] of Object.entries(testCodes)) {
    console.log(`📝 Testing ${language.toUpperCase()}:`);
    
    try {
      const result = await executeCode(code, '3 5', language);
      console.log(`📊 Result:`, result);
      
      if (result.verdict === 'Success' && result.output.trim() === '8') {
        console.log(`✅ ${language} test PASSED\n`);
      } else {
        console.log(`❌ ${language} test FAILED`);
        console.log(`   Expected: '8', Got: '${result.output}'`);
        console.log(`   Verdict: ${result.verdict}\n`);
      }
    } catch (error) {
      console.error(`❌ ${language} test ERROR:`, error, '\n');
    }
  }
  
  // Test timeout functionality
  console.log('⏰ Testing timeout with infinite loop:');
  const infiniteLoop = `#include <iostream>
using namespace std;

int main() {
    while(true) {
        // Infinite loop to test timeout
        int x = 1;
    }
    return 0;
}`;
  
  try {
    const result = await executeCode(infiniteLoop, '', 'cpp');
    console.log(`📊 Timeout test result:`, result);
    
    if (result.verdict === 'Time Limit Exceeded') {
      console.log(`✅ Timeout test PASSED\n`);
    } else {
      console.log(`❌ Timeout test FAILED - Expected TLE, got ${result.verdict}\n`);
    }
  } catch (error) {
    console.error(`❌ Timeout test ERROR:`, error, '\n');
  }
  
  // Test compilation error
  console.log('🔧 Testing compilation error:');
  const invalidCode = `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b
    cout << a + b << endl; // Missing semicolon
    return 0;
}`;
  
  try {
    const result = await executeCode(invalidCode, '3 5', 'cpp');
    console.log(`📊 Compilation error test:`, result);
    
    if (result.verdict === 'Compilation Error') {
      console.log(`✅ Compilation error test PASSED\n`);
    } else {
      console.log(`❌ Compilation error test FAILED\n`);
    }
  } catch (error) {
    console.error(`❌ Compilation error test ERROR:`, error, '\n');
  }
  
  console.log('🎉 Windows execution testing completed!');
}

testWindowsExecution().catch(console.error);