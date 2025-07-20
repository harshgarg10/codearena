const { exec } = require('child_process');
const path = require('path');

const languages = ['cpp', 'python', 'java'];

async function setupDockerImages() {
  console.log('🐳 Setting up base Docker images...');
  
  for (const lang of languages) {
    const languageDir = path.join(__dirname, '..', 'languages', lang);
    const imageName = `codearena-${lang}-base`;
    
    console.log(`📦 Building base image for ${lang}...`);
    
    await new Promise((resolve, reject) => {
      exec(`docker build -t ${imageName} ${languageDir}`, (err, stdout, stderr) => {
        if (err) {
          console.error(`❌ Failed to build ${lang} image:`, stderr);
          reject(err);
        } else {
          console.log(`✅ Successfully built ${imageName}`);
          resolve();
        }
      });
    });
  }
  
  console.log('🎉 All Docker images built successfully!');
}

setupDockerImages().catch(console.error);