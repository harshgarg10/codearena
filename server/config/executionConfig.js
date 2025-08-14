const path = require('path');

// Environment detection
const isDeployment = false;
const isLocalhost = true;
// Execution mode logic:
// - Localhost: Use Docker (secure isolation)
// - Deployment: Use native (avoid Docker-in-Docker)
const USE_DOCKER = true;

const EXECUTION_CONFIG = {
  mode: 'docker',

  native: {
    tempDir: path.join(__dirname, '..', 'temp'),
    timeout: 5000,
    memoryLimit: '128MB',
    supportedLanguages: ['cpp', 'python', 'java']
  },
  
  docker: {
    timeout: 10000, // Increased from 5000 to 10000ms
    memoryLimit: '256m', // Increased from 128m to 256m for Java
    cpuLimit: '1.0', // Increased from 0.5 to 1.0
    networkMode: 'none',
    supportedLanguages: ['cpp', 'python', 'java'],
    images: {
      cpp: 'codearena-cpp',
      python: 'codearena-python', 
      java: 'codearena-java'
    }
  }
};

// Environment logging
if (isLocalhost) {
  console.log('🏠 LOCALHOST ENVIRONMENT DETECTED');
  console.log('🐳 Using DOCKER execution for security and isolation');
  console.log('🔧 Make sure Docker Desktop is running');
} else {
  console.log('☁️  DEPLOYMENT ENVIRONMENT DETECTED');
  console.log('⚡ Using NATIVE execution for performance');
  console.log('🚀 Optimized for production deployment');
}

console.log(`🎯 Execution mode: ${EXECUTION_CONFIG.mode.toUpperCase()}`);

module.exports = {
  EXECUTION_CONFIG,
  isLocalhost,
  isDeployment,
  USE_DOCKER
};