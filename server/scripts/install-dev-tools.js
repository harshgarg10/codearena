const { exec } = require('child_process');
const os = require('os');

async function installDevTools() {
  console.log('🛠️ Development tools installer for Windows...\n');
  
  if (os.platform() !== 'win32') {
    console.log('❌ This installer is for Windows only.');
    return;
  }
  
  console.log('📋 To run code execution, you need:');
  console.log('');
  console.log('1. 🔧 MinGW-w64 (for C++ compilation)');
  console.log('   Download: https://www.mingw-w64.org/downloads/');
  console.log('   Or install via: winget install mingw');
  console.log('');
  console.log('2. 🐍 Python (for Python execution)');
  console.log('   Download: https://www.python.org/downloads/');
  console.log('   Or install via: winget install Python.Python.3');
  console.log('');
  console.log('3. ☕ Java JDK (for Java execution)');
  console.log('   Download: https://adoptium.net/');
  console.log('   Or install via: winget install Eclipse.Temurin.21.JDK');
  console.log('');
  
  // Check if winget is available
  try {
    await new Promise((resolve, reject) => {
      exec('winget --version', (err, stdout) => {
        if (err) reject(err);
        else {
          console.log(`✅ Winget found: ${stdout.trim()}`);
          console.log('');
          console.log('🚀 Quick install commands:');
          console.log('   winget install mingw');
          console.log('   winget install Python.Python.3');
          console.log('   winget install Eclipse.Temurin.21.JDK');
          console.log('');
          resolve();
        }
      });
    });
  } catch (error) {
    console.log('⚠️ Winget not available. Please install tools manually.');
  }
  
  console.log('📝 After installation, restart your terminal and run:');
  console.log('   npm run test');
  console.log('');
  console.log('💡 Make sure all tools are in your PATH environment variable.');
}

installDevTools().catch(console.error);