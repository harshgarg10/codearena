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

      // Docker command with no maxBuffer limit since we're using files
      const dockerCmd = `docker run --rm --network none -v "${folder}:/code" --memory=512m --cpus="1.0" --ulimit nproc=100 --read-only --tmpfs /tmp ${config.image}`;

      console.log(`🐳 Executing: ${dockerCmd}`);
      console.log(`📁 Temp folder: ${folder}`);
      console.log(`📄 Input file contents: "${fs.readFileSync(inputPath, 'utf-8')}"`);

      exec(dockerCmd, { 
        timeout: 30000, // 30 seconds
        killSignal: 'SIGKILL'
        // No maxBuffer since we're reading from files
      }, (err, stdout, stderr) => {
        let executionTime = 0;
        let exitCode = null;
        let programOutput = '';
        let verdict = 'Runtime Error';

        console.log(`📤 Docker stdout: "${stdout}"`);
        console.log(`📤 Docker stderr: "${stderr}"`);

        // Replace the section where you read the output file
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
              } else if (line.trim() !== '') { // Only add non-empty lines
                outputLines.push(line);
              }
            }
            
            programOutput = outputLines.join('\n').trim();
            
            // Check output size (limit to 50MB in file)
            const outputSizeBytes = Buffer.byteLength(programOutput, 'utf8');
            if (outputSizeBytes > 50 * 1024 * 1024) { // 50MB
              return resolve({
                verdict: 'Runtime Error',
                output: `Output too large (${(outputSizeBytes / (1024 * 1024)).toFixed(1)}MB). Maximum allowed: 50MB.`,
                time: executionTime
              });
            }
            
            console.log(`📄 Program output: "${programOutput}"`);
            console.log(`📊 Output size: ${(outputSizeBytes / 1024).toFixed(1)}KB`);
            
          } else {
            console.warn('⚠️ No output file found, falling back to stdout/stderr');
            programOutput = stdout || stderr || 'No output produced';
            
            // Try to extract time from stderr if available
            if (stderr) {
              const timeMatch = stderr.match(/TIME:([0-9.]+)/);
              if (timeMatch) {
                executionTime = parseFloat(timeMatch[1]);
                console.log(`⏱️ Extracted time from stderr: ${executionTime}s`);
              }
            }
          }

          // Determine verdict based on exit code and errors
          if (err) {
            console.log(`💥 Docker execution error:`, err.message);
            if (err.killed || err.signal === 'SIGTERM' || err.signal === 'SIGKILL') {
              verdict = 'TLE';
              programOutput = 'Time Limit Exceeded (30s)';
              executionTime = 30.0;
            } else if (err.message && err.message.includes('maxBuffer exceeded')) {
              verdict = 'Runtime Error';
              programOutput = 'Output size limit exceeded';
            } else {
              // Check if it's a compilation error
              if ((stderr && stderr.includes('error')) || programOutput.includes('error') || programOutput.includes('Compilation failed')) {
                verdict = 'Compilation Error';
                programOutput = stderr || programOutput;
              } else {
                verdict = 'Runtime Error';
                programOutput = stderr || err.message || programOutput || 'Unknown runtime error';
              }
            }
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
            verdict = 'Success'; // Default to success if no clear error
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

          console.log(`${verdict === 'Success' ? '✅' : '❌'} Final verdict: ${verdict}. Time: ${executionTime}s. Output: "${programOutput.substring(0, 100)}..."`);
                
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