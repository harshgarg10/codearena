const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

const TEMP_DIR = path.join(__dirname, '..', 'temp');
const IS_WINDOWS = os.platform() === 'win32';

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const LANGUAGE_CONFIG = {
  cpp: {
    filename: 'main.cpp',
    compile: (srcPath, binPath) => IS_WINDOWS ? 
      `g++ -O2 -std=c++17 "${srcPath}" -o "${binPath}"` : // Remove .exe here
      `g++ -O2 -std=c++17 "${srcPath}" -o "${binPath}"`,
    execute: (binPath) => IS_WINDOWS ? `"${binPath}"` : `"${binPath}"`, // Remove .exe here too
    needsCompilation: true
  },
  python: {
    filename: 'main.py',
    compile: null,
    execute: (srcPath) => `python "${srcPath}"`,
    needsCompilation: false
  },
  java: {
    filename: 'Main.java',
    compile: (srcPath, binDir) => `javac "${srcPath}" -d "${binDir}"`,
    execute: (binDir) => `java -cp "${binDir}" Main`,
    needsCompilation: true
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
    const workDir = path.join(TEMP_DIR, submissionId);
    
    try {
      // Create working directory
      fs.mkdirSync(workDir, { recursive: true });
      console.log(`📁 Created working directory: ${workDir}`);

      // Write source code and input
      const srcPath = path.join(workDir, config.filename);
      const inputPath = path.join(workDir, 'input.txt');
      
      fs.writeFileSync(srcPath, code);
      fs.writeFileSync(inputPath, input || '');
      
      console.log(`📝 Written ${language} code and input`);

      if (IS_WINDOWS) {
        executeOnWindows(config, srcPath, inputPath, workDir, language, resolve);
      } else {
        executeOnLinux(config, srcPath, inputPath, workDir, language, resolve);
      }

    } catch (error) {
      console.error('❌ Execution setup error:', error);
      cleanup(workDir);
      resolve({
        verdict: 'Runtime Error',
        output: `Setup failed: ${error.message}`,
        time: 0
      });
    }
  });
}

function executeOnWindows(config, srcPath, inputPath, workDir, language, resolve) {
  console.log('🪟 Using Windows execution with Job Objects');
  
  const binPath = config.needsCompilation ? 
    path.join(workDir, language === 'java' ? 'bin' : 'main') : srcPath;

  if (config.needsCompilation) {
    compileOnWindows(config, srcPath, binPath, inputPath, workDir, language, resolve);
  } else {
    runOnWindows(config, srcPath, inputPath, workDir, resolve);
  }
}

function compileOnWindows(config, srcPath, binPath, inputPath, workDir, language, resolve) {
  const compileCmd = config.compile(srcPath, binPath);
  console.log(`🔧 Compiling on Windows: ${compileCmd}`);
  
  const startTime = Date.now();
  exec(compileCmd, {
    cwd: workDir,
    timeout: 10000, // 10 second compile timeout
    windowsHide: true
  }, (err, stdout, stderr) => {
    const compileTime = (Date.now() - startTime) / 1000;
    
    if (err) {
      console.log('❌ Compilation failed:', stderr);
      cleanup(workDir);
      return resolve({
        verdict: 'Compilation Error',
        output: stderr || 'Compilation failed',
        time: compileTime
      });
    }

    console.log('✅ Compilation successful');
    
    // Fix: Correct executable path construction
    let executablePath;
    if (language === 'java') {
      executablePath = binPath; // Java doesn't need .exe
    } else if (IS_WINDOWS) {
      // For C++ on Windows, the compile command already adds .exe
      executablePath = `${binPath}.exe`;
    } else {
      executablePath = binPath;
    }
    
    console.log(`🎯 Executing: ${executablePath}`);
    runOnWindows(config, executablePath, inputPath, workDir, resolve);
  });
}


function runOnWindows(config, executablePath, inputPath, workDir, resolve) {
  const runCmd = config.execute(executablePath);
  console.log(`🚀 Running on Windows: ${runCmd}`);
  
  // Use a simpler approach without PowerShell jobs for better compatibility
  const startTime = Date.now();
  
  const child = exec(runCmd, {
    cwd: workDir,
    timeout: 5000, // 5 second timeout
    windowsHide: true,
    maxBuffer: 1024 * 1024 // 1MB buffer
  }, (err, stdout, stderr) => {
    const executionTime = (Date.now() - startTime) / 1000;
    
    let verdict = 'Success';
    let output = stdout.trim();
    
    if (err) {
      if (err.killed || err.code === 'ENOENT' || err.signal === 'SIGTERM') {
        verdict = 'Time Limit Exceeded';
        output = 'Execution timed out';
      } else {
        verdict = 'Runtime Error';
        output = stderr || err.message || 'Unknown runtime error';
      }
    }
    
    console.log(`📊 Windows execution result: ${verdict}, Time: ${executionTime}s`);
    
    cleanup(workDir);
    resolve({
      verdict,
      output: output || 'No output produced',
      time: executionTime
    });
  });
  
  // Provide input
  if (fs.existsSync(inputPath)) {
    try {
      const inputData = fs.readFileSync(inputPath, 'utf-8');
      child.stdin.write(inputData);
      child.stdin.end();
    } catch (error) {
      console.error('⚠️ Failed to write input:', error.message);
    }
  }
}

function executeOnLinux(config, srcPath, inputPath, workDir, language, resolve) {
  console.log('🐧 Using Linux execution');
  
  const binPath = config.needsCompilation ? 
    path.join(workDir, language === 'java' ? 'bin' : 'main') : srcPath;

  if (config.needsCompilation) {
    compileOnLinux(config, srcPath, binPath, inputPath, workDir, resolve);
  } else {
    runOnLinux(config, srcPath, inputPath, workDir, resolve);
  }
}

function compileOnLinux(config, srcPath, binPath, inputPath, workDir, resolve) {
  const compileCmd = config.compile(srcPath, binPath);
  console.log(`🔧 Compiling on Linux: ${compileCmd}`);
  
  exec(compileCmd, {
    cwd: workDir,
    timeout: 10000
  }, (err, stdout, stderr) => {
    if (err) {
      cleanup(workDir);
      return resolve({
        verdict: 'Compilation Error',
        output: stderr || 'Compilation failed',
        time: 0
      });
    }

    runOnLinux(config, binPath, inputPath, workDir, resolve);
  });
}

function runOnLinux(config, executablePath, inputPath, workDir, resolve) {
  const runCmd = config.execute(executablePath);
  console.log(`🚀 Running on Linux: ${runCmd}`);
  
  const startTime = Date.now();
  const child = exec(runCmd, {
    cwd: workDir,
    timeout: 5000, // 5 second timeout
    maxBuffer: 1024 * 1024
  }, (err, stdout, stderr) => {
    const executionTime = (Date.now() - startTime) / 1000;
    
    let verdict = 'Success';
    let output = stdout;
    
    if (err) {
      if (err.killed || err.code === 'ENOENT') {
        verdict = 'Time Limit Exceeded';
        output = 'Execution timed out';
      } else {
        verdict = 'Runtime Error';
        output = stderr || err.message;
      }
    }
    
    cleanup(workDir);
    resolve({
      verdict,
      output: output.trim() || 'No output produced',
      time: executionTime
    });
  });
  
  // Provide input
  if (fs.existsSync(inputPath)) {
    const inputData = fs.readFileSync(inputPath, 'utf-8');
    child.stdin.write(inputData);
    child.stdin.end();
  }
}

function cleanup(workDir) {
  try {
    if (fs.existsSync(workDir)) {
      // On Windows, sometimes files are locked, so we need to retry
      const maxRetries = 3;
      let retries = 0;
      
      const attemptCleanup = () => {
        try {
          fs.rmSync(workDir, { recursive: true, force: true });
          console.log(`🧹 Cleaned up working directory: ${workDir}`);
        } catch (error) {
          retries++;
          if (retries < maxRetries && IS_WINDOWS) {
            console.log(`⏳ Retrying cleanup (${retries}/${maxRetries})...`);
            setTimeout(attemptCleanup, 1000);
          } else {
            console.error('🧹 Cleanup error:', error.message);
          }
        }
      };
      
      attemptCleanup();
    }
  } catch (error) {
    console.error('🧹 Cleanup error:', error.message);
  }
}

module.exports = { executeCode };