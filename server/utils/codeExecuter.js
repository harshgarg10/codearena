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
  return new Promise(async (resolve) => {
    const config = LANG_CONFIG[language];
    if (!config) {
      return resolve({ verdict: 'Runtime Error', output: 'Unsupported language', time: 0 });
    }

    try {
      await buildImageIfNeeded(language);

      const id = uuid();
      const folder = path.join(TEMP_DIR, id);
      fs.mkdirSync(folder, { recursive: true });

      const filename = config.filename;
      const filepath = path.join(folder, filename);
      const inputPath = path.join(folder, 'input.txt');
      const outputPath = path.join(folder, 'output.txt');

      fs.writeFileSync(filepath, code);
      fs.writeFileSync(inputPath, input || '');

      // Stricter Docker limits for catching infinite loops
      const dockerCmd = `docker run --rm --network none -v "${folder}:/code" --memory=128m --cpus="0.5" --ulimit nproc=50 --read-only --tmpfs /tmp ${config.image}`;

      console.log(`🐳 Executing: ${dockerCmd}`);

      exec(dockerCmd, { 
        timeout: 5000, // 5 seconds total Docker timeout
        killSignal: 'SIGKILL'
      }, (err, stdout, stderr) => {
        let executionTime = 0;
        let exitCode = null;
        let programOutput = '';
        let verdict = 'Runtime Error';

        try {
          // Check what files exist in the folder
          const filesInFolder = fs.readdirSync(folder);
          console.log(`📁 Files in temp folder: ${filesInFolder.join(', ')}`);

          // Read the output file if it exists
          if (fs.existsSync(outputPath)) {
            const fullOutput = fs.readFileSync(outputPath, 'utf-8');
            console.log(`📄 Output file contents: "${fullOutput}"`);
            
            // Parse the output file for time and exit code
            const lines = fullOutput.split('\n');
            const outputLines = [];
            
            for (const line of lines) {
              if (line.startsWith('TIME:')) {
                const timeStr = line.substring(5).trim();
                const parsedTime = parseFloat(timeStr);
                if (!isNaN(parsedTime) && parsedTime >= 0) {
                  executionTime = parsedTime;
                  console.log(`⏱️ Parsed execution time: ${executionTime}s`);
                }
              } else if (line.startsWith('EXIT_CODE:')) {
                exitCode = parseInt(line.substring(10).trim());
                console.log(`🚪 Exit code: ${exitCode}`);
              } else if (line.trim() !== '') {
                outputLines.push(line);
              }
            }
            
            programOutput = outputLines.join('\n').trim();
            
          } else {
            console.warn('⚠️ No output file found, using Docker stdout/stderr');
            programOutput = stdout || stderr || 'No output produced';
          }

          // Better verdict determination with proper TLE detection
          if (err) {
            console.log(`💥 Docker execution error:`, err.message);
            console.log(`💥 Error signal:`, err.signal);
            console.log(`💥 Error killed:`, err.killed);
            
            // Check for timeout/TLE conditions
            if (err.killed || err.signal === 'SIGTERM' || err.signal === 'SIGKILL' || 
                exitCode === 124 || exitCode === 137 || // timeout exit codes
                programOutput.includes('killed') || programOutput.includes('timeout')) {
              verdict = 'TLE';
              programOutput = 'Time Limit Exceeded (2s)';
              executionTime = 2.0;
            } else if (err.message && err.message.includes('maxBuffer exceeded')) {
              verdict = 'Runtime Error';
              programOutput = 'Output size limit exceeded';
            } else {
              // Check compilation vs runtime error
              if (programOutput.includes('error:') || programOutput.includes('Error:') || 
                  programOutput.includes('Compilation failed') || stderr.includes('error')) {
                verdict = 'Compilation Error';
                programOutput = stderr || programOutput || 'Compilation failed';
              } else {
                verdict = 'Runtime Error';
                programOutput = stderr || err.message || programOutput || 'Unknown runtime error';
              }
            }
          } else {
            // Check exit code for TLE detection
            if (exitCode === 124 || exitCode === 137) {
              // Exit code 124 = timeout, 137 = killed by SIGKILL
              verdict = 'TLE';
              programOutput = 'Time Limit Exceeded (2s)';
              executionTime = 2.0;
            } else if (exitCode === 0) {
              verdict = 'Success';
            } else if (exitCode !== null && exitCode !== 0) {
              // Non-zero exit code indicates error
              if (programOutput.includes('error:') || programOutput.includes('Compilation failed')) {
                verdict = 'Compilation Error';
              } else {
                verdict = 'Runtime Error';
              }
            } else {
              verdict = 'Success';
            }
          }

          // Additional check for programs that run too long but don't get killed
          if (executionTime >= 1.8) { // Close to our 2s limit
            verdict = 'TLE';
            programOutput = 'Time Limit Exceeded (2s)';
            executionTime = 2.0;
          }

        } catch (fileError) {
          console.error('❌ Error reading output file:', fileError);
          verdict = 'Runtime Error';
          programOutput = `Failed to read output: ${fileError.message}`;
        } finally {
          // Clean up the temporary folder
          try {
            fs.rmSync(folder, { recursive: true, force: true });
          } catch (cleanupErr) {
            console.error('Cleanup error:', cleanupErr);
          }
        }

        console.log(`${verdict === 'Success' ? '✅' : '❌'} Final verdict: ${verdict}. Time: ${executionTime}s. Exit code: ${exitCode}`);
                
        resolve({
          verdict,
          output: programOutput,
          time: executionTime
        });
      });

    } catch (error) {
      console.error('❌ Code execution error:', error);
      resolve({
        verdict: 'Runtime Error',
        output: `Execution failed: ${error.message}`,
        time: 0
      });
    }
  });
}

module.exports = { executeCode };