require('dotenv').config();
const { executeCode } = require('./utils/codeExecuter');

const testCode = {
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

async function testAllLanguages() {
  console.log('🧪 Testing new code execution system...');
  
  for (const [language, code] of Object.entries(testCode)) {
    console.log(`\n📝 Testing ${language.toUpperCase()}:`);
    
    try {
      const result = await executeCode(code, '3 5', language);
      console.log(`📊 Result:`, result);
      
      if (result.verdict === 'Success' && result.output.trim() === '8') {
        console.log(`✅ ${language} test PASSED`);
      } else {
        console.log(`❌ ${language} test FAILED`);
      }
    } catch (error) {
      console.error(`❌ ${language} test ERROR:`, error);
    }
  }
}

testAllLanguages();