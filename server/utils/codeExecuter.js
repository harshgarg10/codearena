const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const { EXECUTION_CONFIG, isLocal } = require('../config/executionConfig');

const TEMP_DIR = EXECUTION_CONFIG.native.tempDir;
const IS_WINDOWS = os.platform() === 'win32';

// Ensure temp directory exists for native execution
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Native execution language configurations (Windows/Linux)
const NATIVE_LANGUAGE_CONFIG = {
  cpp: {
    filename: 'main.cpp',
    compile: (srcPath, binPath) => IS_WINDOWS ? 
      `g++ -O2 -std=c++17 "${srcPath}" -o "${binPath}"` : 
      `g++ -O2 -std=c++17 "${srcPath}" -o "${binPath}"`,
    execute: (binPath) => IS_WINDOWS ? `"${binPath}"` : `"${binPath}"`,
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

// Docker execution configurations
const DOCKER_LANGUAGE_CONFIG = {
  cpp: {
    image: EXECUTION_CONFIG.docker.images.cpp,
    filename: 'main.cpp',
    needsCompilation: true
  },
  python: {
    image: EXECUTION_CONFIG.docker.images.python,
    filename: 'main.py',
    needsCompilation: false
  },
  java: {
    image: EXECUTION_CONFIG.docker.images.java,
    filename: 'Main.java',
    needsCompilation: true
  }
};

/**
 * Main code execution function - routes to native or docker
 */

function executeCode(code, input, language) {
  console.log(`🎯 Executing ${language} code in docker mode`);
  // --- Simplified for Localhost Only ---
  // Always use Docker execution
  return executeDocker(code, input, language);
}

/**
 * Native execution (Windows/Linux local development)
 */
function executeNative(code, input, language) {
  return new Promise((resolve) => {
    const config = NATIVE_LANGUAGE_CONFIG[language];
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
      console.log(`📁 Created native working directory: ${workDir}`);

      // Write source code and input
      const srcPath = path.join(workDir, config.filename);
      const inputPath = path.join(workDir, 'input.txt');
      
      fs.writeFileSync(srcPath, code);
      fs.writeFileSync(inputPath, input || '');
      
      console.log(`📝 Written ${language} code and input for native execution`);

      if (IS_WINDOWS) {
        executeOnWindows(config, srcPath, inputPath, workDir, language, resolve);
      } else {
        executeOnLinux(config, srcPath, inputPath, workDir, language, resolve);
      }

    } catch (error) {
      console.error('❌ Native execution setup error:', error);
      cleanup(workDir);
      resolve({
        verdict: 'Runtime Error',
        output: `Setup failed: ${error.message}`,
        time: 0
      });
    }
  });
}

function executeDocker(code, input, language) {
  return new Promise((resolve) => {
    const config = DOCKER_LANGUAGE_CONFIG[language];
    if (!config) {
      return resolve({
        verdict: 'Runtime Error',
        output: 'Unsupported language',
        time: 0
      });
    }

    const submissionId = uuidv4();
    const containerName = `code-runner-${submissionId}`;
    
    console.log(`🐳 Starting Docker execution for ${language}`);

    try {
      const hostTempDir = path.join(os.tmpdir(), `code-${submissionId}`);
      
      if (!fs.existsSync(hostTempDir)) {
        fs.mkdirSync(hostTempDir, { recursive: true });
      }

      const srcPath = path.join(hostTempDir, config.filename);
      const inputPath = path.join(hostTempDir, 'input.txt');
      
      fs.writeFileSync(srcPath, code);
      fs.writeFileSync(inputPath, input || '');

      console.log(`📝 Written ${language} code for Docker execution`);

      const dockerCmd = buildDockerCommand(config, containerName, hostTempDir);
      
      console.log(`🐳 Running Docker: ${dockerCmd}`);

      const startTime = Date.now();
      exec(dockerCmd, {
        timeout: EXECUTION_CONFIG.docker.timeout,
        maxBuffer: 1024 * 1024
      }, (err, stdout, stderr) => {
        const executionTime = (Date.now() - startTime) / 1000;
        
        cleanupDocker(containerName, hostTempDir);
        
        let verdict = 'Success';
        let output = stdout.trim();
        
        // Log raw output for debugging
        console.log(`🔍 Raw stdout: "${stdout}"`);
        console.log(`🔍 Raw stderr: "${stderr}"`);
        
        if (err) {
          if (err.killed || err.code === 124) {
            verdict = 'Time Limit Exceeded';
            output = 'Execution timed out';
          } else if (err.code === 1) {
            // Check error patterns from runner scripts
            const errorOutput = stderr.trim() || stdout.trim();
            
            if (errorOutput.includes('COMPILATION_ERROR')) {
              verdict = 'Compilation Error';
              output = errorOutput.replace('COMPILATION_ERROR', '').replace(/^:\s*/, '').trim();
            } else if (errorOutput.includes('TIMEOUT_ERROR')) {
              verdict = 'Time Limit Exceeded';
              output = 'Execution timed out';
            } else if (errorOutput.includes('RUNTIME_ERROR')) {
              verdict = 'Runtime Error';
              output = errorOutput.replace('RUNTIME_ERROR', '').replace(/^:\s*/, '').trim();
            } else if (errorOutput.includes('Could not reserve enough space')) {
              verdict = 'Runtime Error';
              output = 'Memory allocation error - insufficient resources';
            } else {
              verdict = 'Runtime Error';
              output = errorOutput || 'Unknown runtime error';
            }
          } else {
            verdict = 'Runtime Error';
            output = stderr || err.message || 'Unknown error';
          }
        }

        // Filter out debug messages that went to stdout
        const debugMessages = [
          'Starting compilation...',
          'Starting Java compilation...',
          'Compilation successful, starting execution...',
          'Java compilation successful, starting execution...'
        ];
        
        for (const msg of debugMessages) {
          output = output.replace(msg, '').trim();
        }
        
        // Clean up any error prefixes
        output = output.replace(/^(COMPILATION_ERROR|TIMEOUT_ERROR|RUNTIME_ERROR):\s*/, '');
        
        console.log(`📊 Docker execution result: ${verdict}, Time: ${executionTime}s`);
        console.log(`📊 Final output: "${output}"`);
        
        resolve({
          verdict,
          output: output || 'No output produced',
          time: executionTime
        });
      });

    } catch (error) {
      console.error('❌ Docker execution setup error:', error);
      cleanupDocker(containerName, path.join(os.tmpdir(), `code-${submissionId}`));
      resolve({
        verdict: 'Runtime Error',
        output: `Docker setup failed: ${error.message}`,
        time: 0
      });
    }
  });
}

/**
 * Build Docker run command
 */
function buildDockerCommand(config, containerName, hostTempDir) {
  const dockerConfig = EXECUTION_CONFIG.docker;
  
  return [
    'docker run',
    '--rm',
    `--name ${containerName}`,
    `--memory=${dockerConfig.memoryLimit}`,
    `--cpus=${dockerConfig.cpuLimit}`,
    `--network=${dockerConfig.networkMode}`,
    '--ulimit nproc=64:64',
    '--ulimit nofile=64:64',
    `--volume "${hostTempDir}:/code"`,
    '--workdir /code',
    config.image
  ].join(' ');
}

/**
 * Cleanup Docker resources
 */
function cleanupDocker(containerName, hostTempDir) {
  try {
    exec(`docker rm -f ${containerName}`, (err) => {
      if (err) console.log(`🧹 Container ${containerName} already removed`);
    });
    
    if (fs.existsSync(hostTempDir)) {
      fs.rmSync(hostTempDir, { recursive: true, force: true });
      console.log(`🧹 Cleaned up Docker temp directory: ${hostTempDir}`);
    }
  } catch (error) {
    console.error('🧹 Docker cleanup error:', error.message);
  }
}

// Windows execution functions
function executeOnWindows(config, srcPath, inputPath, workDir, language, resolve) {
  console.log('🪟 Using Windows native execution');
  
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
    timeout: 10000,
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
    
    let executablePath;
    if (language === 'java') {
      executablePath = binPath;
    } else if (IS_WINDOWS) {
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
  
  const startTime = Date.now();
  
  const child = exec(runCmd, {
    cwd: workDir,
    timeout: 5000,
    windowsHide: true,
    maxBuffer: 1024 * 1024
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

// Linux execution functions
function executeOnLinux(config, srcPath, inputPath, workDir, language, resolve) {
  console.log('🐧 Using Linux native execution');
  
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
    timeout: 5000,
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