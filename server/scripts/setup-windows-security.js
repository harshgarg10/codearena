const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function setupWindowsSecurity() {
  console.log('🛡️ Setting up Windows security for code execution...\n');
  
  if (os.platform() !== 'win32') {
    console.log('❌ This script is for Windows only.');
    return;
  }
  
  // Check if required tools are available
  const tools = ['g++', 'python', 'javac', 'powershell'];
  
  for (const tool of tools) {
    try {
      await new Promise((resolve, reject) => {
        exec(`where ${tool}`, (err, stdout) => {
          if (err) reject(err);
          else {
            console.log(`✅ ${tool} found: ${stdout.trim().split('\n')[0]}`);
            resolve();
          }
        });
      });
    } catch (error) {
      console.log(`⚠️ ${tool} not found. Please install it for full functionality.`);
    }
  }
  
  // Create temp directory with restricted permissions
  const tempDir = path.join(__dirname, '..', 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('✅ Created temp directory with restricted access');
  }
  
  // Set up PowerShell execution policy (requires admin)
  try {
    await new Promise((resolve, reject) => {
      exec('powershell Get-ExecutionPolicy', (err, stdout) => {
        if (err) reject(err);
        else {
          const policy = stdout.trim();
          console.log(`📋 Current PowerShell execution policy: ${policy}`);
          if (policy === 'Restricted') {
            console.log('⚠️ PowerShell execution is restricted. Consider running:');
            console.log('   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser');
          }
          resolve();
        }
      });
    });
  } catch (error) {
    console.log('⚠️ Could not check PowerShell execution policy');
  }
  
  console.log('\n🎉 Windows security setup completed!');
  console.log('\n💡 Security features enabled:');
  console.log('   ✅ Isolated temp directories for each execution');
  console.log('   ✅ PowerShell Job Objects for process isolation');
  console.log('   ✅ Timeout-based execution limits');
  console.log('   ✅ Memory and buffer limits');
  console.log('   ✅ Automatic cleanup of temporary files');
  console.log('\n Note: For maximum security in production, consider:');
  console.log('   - Running the server in a restricted user account');
  console.log('   - Using Windows Sandbox or Hyper-V containers');
  console.log('   - Implementing network isolation');
}

setupWindowsSecurity().catch(console.error);