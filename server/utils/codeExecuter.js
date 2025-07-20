const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const SUBMISSIONS_DIR = path.join(__dirname, '..', 'submissions');
const LANGUAGES_DIR = path.join(__dirname, '..', 'languages');

// Ensure submissions directory exists
if (!fs.existsSync(SUBMISSIONS_DIR)) {
  fs.mkdirSync(SUBMISSIONS_DIR, { recursive: true });
}

const LANGUAGE_CONFIG = {
  cpp: {
    filename: 'main.cpp',
    languageDir: path.join(LANGUAGES_DIR, 'cpp')
  },
  python: {
    filename: 'main.py',
    languageDir: path.join(LANGUAGES_DIR, 'python')
  },
  java: {
    filename: 'Main.java',
    languageDir: path.join(LANGUAGES_DIR, 'java')
  }
};

function executeCode(code, input, language) {
  return new Promise((resolve) => {
    const config = LANGUAGE_CONFIG[language];
    if (!config) {
      return resolve({
        verdict: 'Runtime Error',
        output: 'Unsupported language',
        time: 0
      });
    }

    const submissionId = uuidv4();
    const submissionPath = path.join(SUBMISSIONS_DIR, submissionId);
    
    try {
      // Create submission directory
      fs.mkdirSync(submissionPath, { recursive: true });
      console.log(`📁 Created submission directory: ${submissionPath}`);

      // Write code and input files
      const codeFilePath = path.join(submissionPath, config.filename);
      const inputFilePath = path.join(submissionPath, 'input.txt');
      
      fs.writeFileSync(codeFilePath, code);
      fs.writeFileSync(inputFilePath, input || '');
      
      console.log(`📝 Written code to: ${codeFilePath}`);
      console.log(`📝 Written input to: ${inputFilePath}`);

      // Copy language-specific files
      const dockerfileSrc = path.join(config.languageDir, 'Dockerfile');
      const runnerSrc = path.join(config.languageDir, 'runner.sh');
      
      console.log(`🔍 Looking for Dockerfile at: ${dockerfileSrc}`);
      console.log(`🔍 Looking for runner.sh at: ${runnerSrc}`);
      
      if (!fs.existsSync(dockerfileSrc)) {
        throw new Error(`Dockerfile not found at: ${dockerfileSrc}`);
      }
      
      if (!fs.existsSync(runnerSrc)) {
        throw new Error(`runner.sh not found at: ${runnerSrc}`);
      }

      fs.copyFileSync(dockerfileSrc, path.join(submissionPath, 'Dockerfile'));
      fs.copyFileSync(runnerSrc, path.join(submissionPath, 'runner.sh'));
      
      console.log(`📋 Copied Dockerfile and runner.sh to submission directory`);
      
      // List files in submission directory for debugging
      const files = fs.readdirSync(submissionPath);
      console.log(`📂 Files in submission directory:`, files);

      const imageName = `code-runner-${submissionId}`;
      
      // Build and run Docker container
      const dockerCommand = `cd "${submissionPath}" && docker build -t ${imageName} . && docker run --rm --memory=128m --cpus="0.5" --network none ${imageName}`;
      
      console.log(`🐳 Executing: ${dockerCommand}`);

      exec(dockerCommand, { 
        timeout: 15000, // Increased timeout to 15 seconds
        killSignal: 'SIGKILL',
        maxBuffer: 1024 * 1024 // 1MB buffer
      }, (err, stdout, stderr) => {
        // Parse execution results
        const result = parseExecutionOutput(stdout, stderr, err);
        
        // Cleanup
        cleanup(submissionPath, imageName);
        
        resolve(result);
      });

    } catch (error) {
      console.error('❌ Execution setup error:', error);
      cleanup(submissionPath, `code-runner-${submissionId}`);
      resolve({
        verdict: 'Runtime Error',
        output: `Setup failed: ${error.message}`,
        time: 0
      });
    }
  });
}

function parseExecutionOutput(stdout, stderr, err) {
  let verdict = 'Runtime Error';
  let output = '';
  let executionTime = 0;
  let exitCode = null;

  console.log('📄 Raw stdout:', stdout);
  console.log('📄 Raw stderr:', stderr);

  if (err) {
    console.log('❌ Execution error:', err.message);
    
    if (err.killed || err.signal === 'SIGKILL' || err.code === 'ENOENT') {
      verdict = 'Time Limit Exceeded';
      output = 'Execution timed out or was killed';
      executionTime = 2.0;
    } else {
      verdict = 'Runtime Error';
      output = stderr || err.message || 'Unknown error occurred';
    }
  } else {
    // Parse the structured output from runner.sh
    const lines = (stdout || '').split('\n');
    const outputLines = [];
    
    for (const line of lines) {
      if (line.startsWith('VERDICT:')) {
        verdict = line.substring(8).trim();
      } else if (line.startsWith('TIME:')) {
        const timeStr = line.substring(5).trim();
        const parsedTime = parseFloat(timeStr);
        if (!isNaN(parsedTime) && parsedTime >= 0) {
          executionTime = parsedTime;
        }
      } else if (line.startsWith('EXIT_CODE:')) {
        exitCode = parseInt(line.substring(10).trim());
      } else if (line.trim() !== '') {
        outputLines.push(line);
      }
    }
    
    output = outputLines.join('\n').trim();
  }

  // Final verdict validation
  if (verdict === 'Success' && !output) {
    output = 'Program executed successfully but produced no output';
  }

  console.log(`📊 Final result: ${verdict}, Time: ${executionTime}s, Exit: ${exitCode}`);

  return {
    verdict: verdict === 'Success' ? 'Success' : verdict,
    output: output || 'No output produced',
    time: executionTime
  };
}

function cleanup(submissionPath, imageName) {
  try {
    // Remove submission directory
    if (fs.existsSync(submissionPath)) {
      fs.rmSync(submissionPath, { recursive: true, force: true });
      console.log(`🧹 Cleaned up submission directory: ${submissionPath}`);
    }
    
    // Remove Docker image
    exec(`docker rmi ${imageName}`, (err) => {
      if (err) {
        console.log(`⚠️ Failed to remove Docker image ${imageName}: ${err.message}`);
      } else {
        console.log(`🧹 Cleaned up Docker image: ${imageName}`);
      }
    });
  } catch (error) {
    console.error('🧹 Cleanup error:', error.message);
  }
}

module.exports = { executeCode };