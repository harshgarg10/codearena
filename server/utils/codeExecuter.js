const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

const LANG_CONFIG = {
  cpp: {
    image: 'codearena-cpp',
    extension: '.cpp',
    dockerfile: 'cpp.Dockerfile',
    filename: 'main.cpp'
  },
  python: {
    image: 'codearena-python',
    extension: '.py', 
    dockerfile: 'python.Dockerfile',
    filename: 'main.py'
  },
  java: {
    image: 'codearena-java',
    extension: '.java',
    dockerfile: 'java.Dockerfile', 
    filename: 'Main.java'
  },
};

function buildImageIfNeeded(language) {
  return new Promise((resolve, reject) => {
    const { image, dockerfile } = LANG_CONFIG[language];
    
    // Check if image exists
    exec(`docker image inspect ${image}`, (err) => {
      if (!err) {
        console.log(`✅ Docker image ${image} already exists`);
        return resolve();
      }

      console.log(`⏳ Building Docker image for ${language}...`);
      const dockerfilePath = path.join(__dirname, '..', 'docker', dockerfile);
      const dockerDir = path.join(__dirname, '..', 'docker');
      
      exec(`docker build -t ${image} -f ${dockerfilePath} ${dockerDir}`, (err, stdout, stderr) => {
        if (err) {
          console.error(`Docker build failed for ${language}:`, stderr);
          return reject(`Docker build failed: ${stderr}`);
        }
        console.log(`✅ Successfully built ${image}`);
        resolve();
      });
    });
  });
}

function executeCode(code, input, language) {
  return new Promise(async (resolve, reject) => {
    const config = LANG_CONFIG[language];
    if (!config) {
      return resolve({ output: '❌ Unsupported language' });
    }

    try {
      // Build Docker image if needed
      await buildImageIfNeeded(language);

      const id = uuid();
      const folder = path.join(TEMP_DIR, id);
      fs.mkdirSync(folder, { recursive: true });

      const filename = config.filename;
      const filepath = path.join(folder, filename);
      const inputPath = path.join(folder, 'input.txt');

      // Write code and input files
      fs.writeFileSync(filepath, code);
      fs.writeFileSync(inputPath, input || '');

      // Prepare Docker command with security restrictions
      const dockerCmd = `docker run --rm --network none -v "${folder}:/code" --memory=128m --cpus="0.5" --ulimit nproc=50 --read-only --tmpfs /tmp ${config.image}`;

      console.log(`🐳 Executing: ${dockerCmd}`);

      exec(dockerCmd, { timeout: 10000 }, (err, stdout, stderr) => {
        // Clean up temp folder
        try {
          fs.rmSync(folder, { recursive: true, force: true });
        } catch (cleanupErr) {
          console.error('Cleanup error:', cleanupErr);
        }

        if (err) {
          console.error('Execution error:', err);
          if (err.killed || err.signal === 'SIGTERM') {
            return resolve({ output: '❌ Time Limit Exceeded (10s)' });
          }
          return resolve({ output: stderr || err.message || '❌ Runtime Error' });
        }

        if (stderr && stderr.trim()) {
          return resolve({ output: `❌ Error: ${stderr.trim()}` });
        }

        resolve({ output: stdout.trim() || '✅ Program executed successfully (no output)' });
      });

    } catch (error) {
      console.error('Code execution error:', error);
      resolve({ output: `❌ Execution failed: ${error.message}` });
    }
  });
}

module.exports = { executeCode };