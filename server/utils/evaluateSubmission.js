const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { executeCode } = require('./codeExecuter');
const { secureFileRead, isValidTestcasePath } = require('./secureFileAccess');
const os = require('os');
const EXECUTION_PLATFORM = os.platform() === 'win32' ? 'windows' : 'linux';
const compareOutputs = (actual, expected) => {
  // Trim both outputs
  const actualTrimmed = actual.trim();
  const expectedTrimmed = expected.trim();
  
  // Quick length check first
  if (actualTrimmed.length !== expectedTrimmed.length) {
    return false;
  }
  
  // For very large outputs, compare in chunks to avoid memory issues
  if (actualTrimmed.length > 5 * 1024 * 1024) { // 5MB chunks
    const chunkSize = 1024 * 1024; // 1MB chunks
    console.log(`🔍 Comparing large output in ${Math.ceil(actualTrimmed.length / chunkSize)} chunks`);
    
    for (let i = 0; i < actualTrimmed.length; i += chunkSize) {
      const actualChunk = actualTrimmed.slice(i, i + chunkSize);
      const expectedChunk = expectedTrimmed.slice(i, i + chunkSize);
      if (actualChunk !== expectedChunk) {
        console.log(`❌ Mismatch found in chunk starting at position ${i}`);
        return false;
      }
    }
    console.log(`✅ Large output comparison completed successfully`);
    return true;
  }
  
  // For smaller outputs, direct comparison
  return actualTrimmed === expectedTrimmed;
};

const evaluateSubmission = async ({ code, language, username, problemId, duelId = null }) => {
  try {
    console.log(`🔍 Starting evaluation for user: ${username}, problem: ${problemId}`);
    
    // Get user ID
    const [userRows] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    const userId = userRows[0]?.id;
    if (!userId) throw new Error('User not found');

    // Get testcases for this problem
    const [testcases] = await db.execute(
      'SELECT * FROM testcases WHERE problem_id = ? ORDER BY id',
      [problemId]
    );

    console.log(`📝 Found ${testcases.length} testcases for problem ${problemId}`);

    if (testcases.length === 0) {
      console.error(`❌ No testcases found for problem ${problemId}`);
      
      // Check if testcase files exist in filesystem
      const testcaseDir = path.join(__dirname, '..', 'testcases', `problem-${problemId}`);
      console.log(`🔍 Checking directory: ${testcaseDir}`);
      
      if (fs.existsSync(testcaseDir)) {
        const files = fs.readdirSync(testcaseDir);
        console.log(`📁 Files in testcase directory:`, files);
        
        // Create testcases from files if they exist
        const inputFiles = files.filter(f => f.startsWith('input') && f.endsWith('.txt')).sort();
        const outputFiles = files.filter(f => f.startsWith('output') && f.endsWith('.txt')).sort();
        
        if (inputFiles.length > 0 && outputFiles.length > 0) {
          console.log(`🔧 Creating testcase entries in database...`);
          
          for (let i = 0; i < Math.min(inputFiles.length, outputFiles.length); i++) {
            const inputPath = path.join(testcaseDir, inputFiles[i]);
            const outputPath = path.join(testcaseDir, outputFiles[i]);
            
            await db.execute(
              `INSERT INTO testcases (problem_id, is_sample, input_path, output_path, score)
               VALUES (?, ?, ?, ?, ?)`,
              [problemId, i === 0 ? 1 : 0, inputPath, outputPath, 1]
            );
            console.log(`✅ Created testcase ${i + 1} for problem ${problemId}`);
          }
          
          // Re-fetch testcases
          const [newTestcases] = await db.execute(
            'SELECT * FROM testcases WHERE problem_id = ? ORDER BY id',
            [problemId]
          );
          
          if (newTestcases.length === 0) {
            throw new Error('Failed to create testcases');
          }
          
          console.log(`🔄 Re-running with ${newTestcases.length} testcases`);
          return evaluateSubmission({ code, language, username, problemId, duelId });
        }
      }
      
      throw new Error('No testcases found for this problem');
    }

    let passed = 0;
    let totalScore = 0;
    let maxTime = 0;
    let finalVerdict = 'Accepted';

    for (let i = 0; i < testcases.length; i++) {
      const tc = testcases[i];
      console.log(`🧪 Running testcase ${i + 1}/${testcases.length}`);
      
      try {
        // Read input and expected output
        const inputPath = tc.input_path;
        const outputPath = tc.output_path;
        
        console.log(`📂 Reading from: ${inputPath}`);
        console.log(`📂 Expected output from: ${outputPath}`);
        
        // Check if files exist
        if (!fs.existsSync(inputPath)) {
          console.error(`❌ Input file not found: ${inputPath}`);
          throw new Error(`Input file not found: ${inputPath}`);
        }
        
        if (!fs.existsSync(outputPath)) {
          console.error(`❌ Output file not found: ${outputPath}`);
          throw new Error(`Output file not found: ${outputPath}`);
        }
        if (!isValidTestcasePath(inputPath) || !isValidTestcasePath(outputPath)) {
          console.error(`🚨 Invalid testcase file paths detected`);
          throw new Error('Invalid testcase configuration');
        }
        
        console.log(`📂 Reading testcase files (secured)`);

        const input = secureFileRead(inputPath).trim();
        const expectedOutput = secureFileRead(outputPath).trim();

        console.log(`📥 Input: "${input}"`);
        console.log(`📤 Expected: "${expectedOutput}"`);

        // Execute the code
        const result = await executeCode(code, input, language);
        
        console.log(`⚡ Execution result:`, result);

        // Check the verdict from the code executer
        if (result.verdict !== 'Success') {
          finalVerdict = result.verdict;
          console.log(`💥 Testcase ${i + 1} failed with ${finalVerdict}: ${result.output}`);
          break; // Stop on first error
        }
        
        const executionTime = result.time || 0;
        if (compareOutputs(result.output, expectedOutput)) {
          passed += 1;
          totalScore += tc.score;
          console.log(`✅ Testcase ${i + 1} passed (${result.output.length} chars output)`);
        } else {
          finalVerdict = 'Wrong Answer';
          // For large outputs, show just a preview of the mismatch
          const actualPreview = result.output.trim().substring(0, 100);
          const expectedPreview = expectedOutput.substring(0, 100);
          console.log(`❌ Testcase ${i + 1} failed.`);
          console.log(`   Got (first 100 chars): "${actualPreview}..."`);
          console.log(`   Expected (first 100 chars): "${expectedPreview}..."`);
          break;
        }
        
        maxTime = Math.max(maxTime, executionTime);
        
      } catch (fileError) {
        console.error(`📁 File reading error for testcase ${i + 1}:`, fileError);
        finalVerdict = 'Runtime Error';
        break;
      }
    }

    // Final verdict
    if (passed === testcases.length && finalVerdict === 'Accepted') {
      finalVerdict = 'Accepted';
    }

    console.log(`📊 Final result: ${passed}/${testcases.length} passed, verdict: ${finalVerdict}`);

    // Save to submissions table

    await db.execute(
      `INSERT INTO submissions (user_id, problem_id, duel_id, code, language, verdict, time_taken, score, execution_platform)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, problemId, duelId, code, language, finalVerdict, maxTime, totalScore, EXECUTION_PLATFORM]
    );

    return {
      verdict: finalVerdict,
      passed,
      total: testcases.length,
      score: totalScore,
      time: maxTime
    };

  } catch (err) {
    console.error('❌ Evaluation error:', err);
    throw err;
  }
};

module.exports = { evaluateSubmission };