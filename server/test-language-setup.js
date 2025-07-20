const fs = require('fs');
const path = require('path');

const testLanguageSetup = () => {
  console.log('🔍 Testing language directory setup...\n');
  
  const languages = ['cpp', 'python', 'java'];
  let allGood = true;
  
  for (const lang of languages) {
    console.log(`📋 Checking ${lang}:`);
    
    const langDir = path.join(__dirname, 'languages', lang);
    const dockerfilePath = path.join(langDir, 'Dockerfile');
    const runnerPath = path.join(langDir, 'runner.sh');
    
    if (!fs.existsSync(langDir)) {
      console.log(`  ❌ Directory missing: ${langDir}`);
      allGood = false;
    } else {
      console.log(`  ✅ Directory exists: ${langDir}`);
    }
    
    if (!fs.existsSync(dockerfilePath)) {
      console.log(`  ❌ Dockerfile missing: ${dockerfilePath}`);
      allGood = false;
    } else {
      console.log(`  ✅ Dockerfile exists`);
    }
    
    if (!fs.existsSync(runnerPath)) {
      console.log(`  ❌ runner.sh missing: ${runnerPath}`);
      allGood = false;
    } else {
      console.log(`  ✅ runner.sh exists`);
    }
    
    console.log('');
  }
  
  if (allGood) {
    console.log('🎉 All language files are properly set up!');
  } else {
    console.log('❌ Some files are missing. Please create them first.');
  }
};

testLanguageSetup();