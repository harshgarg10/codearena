const { EXECUTION_CONFIG, isLocalhost, isDeployment } = require('./config/executionConfig');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function setupEnvironment() {
  console.log('🔧 Setting up CodeArena execution environment for Localhost...\n');
  
  // --- Simplified for Localhost Only ---
  console.log('🏠 LOCALHOST SETUP');
  console.log('==================');
  console.log('✅ Docker execution mode enabled');
  console.log('🔒 Secure isolation for code execution');
  console.log('🐳 Checking Docker availability...\n');
  
  await checkDockerAvailability();
  await ensureDockerImages();
  
  console.log('\n🎉 Environment setup completed successfully!');
  console.log(`🎯 Code execution mode: ${EXECUTION_CONFIG.mode.toUpperCase()}`);
}
async function checkDockerAvailability() {
  return new Promise((resolve) => {
    exec('docker --version', (err, stdout, stderr) => {
      if (err) {
        console.log('❌ Docker not available');
        console.log('💡 Please install Docker Desktop for localhost development');
        console.log('🔗 Download: https://www.docker.com/products/docker-desktop/');
        process.exit(1);
      } else {
        console.log('✅ Docker is available:', stdout.trim());
        
        // Check if Docker daemon is running
        exec('docker ps', (err2) => {
          if (err2) {
            console.log('❌ Docker daemon not running');
            console.log('💡 Please start Docker Desktop');
            process.exit(1);
          } else {
            console.log('✅ Docker daemon is running');
            resolve();
          }
        });
      }
    });
  });
}

async function ensureDockerImages() {
  console.log('🔍 Checking Docker images...');
  
  const images = ['codearena-cpp', 'codearena-python', 'codearena-java'];
  const missingImages = [];
  
  for (const image of images) {
    await new Promise((resolve) => {
      exec(`docker images -q ${image}`, (err, stdout) => {
        if (!stdout.trim()) {
          missingImages.push(image);
          console.log(`❌ Missing image: ${image}`);
        } else {
          console.log(`✅ Image available: ${image}`);
        }
        resolve();
      });
    });
  }
  
  if (missingImages.length > 0) {
    console.log('\n🔧 Building missing Docker images...');
    console.log('💡 Run: npm run build-docker');
    console.log('⏳ This may take a few minutes on first setup\n');
    
    // Auto-build images
    await buildDockerImages();
  } else {
    console.log('✅ All Docker images are ready');
  }
}

async function buildDockerImages() {
  return new Promise((resolve, reject) => {
    console.log('🏗️  Auto-building Docker images...');
    
    exec('npm run build-docker', { timeout: 300000 }, (err, stdout, stderr) => {
      if (err) {
        console.log('❌ Failed to build Docker images');
        console.log('💡 Please run manually: npm run build-docker');
        console.log('Error:', stderr);
        reject(err);
      } else {
        console.log('✅ Docker images built successfully');
        resolve();
      }
    });
  });
}

async function checkNativeTools() {
  const tools = [
    { name: 'g++', command: 'g++ --version' },
    { name: 'python', command: 'python --version' },
    { name: 'javac', command: 'javac -version' }
  ];
  
  for (const tool of tools) {
    await new Promise((resolve) => {
      exec(tool.command, (err, stdout, stderr) => {
        if (err) {
          console.log(`❌ ${tool.name} not available`);
          console.log(`💡 Please install ${tool.name} for production deployment`);
        } else {
          const version = stdout || stderr;
          console.log(`✅ ${tool.name} available:`, version.split('\n')[0]);
        }
        resolve();
      });
    });
  }
}

async function ensureTempDirectories() {
  const tempDir = EXECUTION_CONFIG.native.tempDir;
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`✅ Created temp directory: ${tempDir}`);
  } else {
    console.log(`✅ Temp directory exists: ${tempDir}`);
  }
  
  // Set appropriate permissions on Linux/Unix
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(tempDir, '755');
      console.log('✅ Set temp directory permissions');
    } catch (error) {
      console.log('⚠️  Could not set temp directory permissions');
    }
  }
}

if (require.main === module) {
  setupEnvironment().catch(error => {
    console.error('❌ Environment setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { setupEnvironment };