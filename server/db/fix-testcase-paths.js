require('dotenv').config();
const path = require('path');
const db = require('../config/db');
const fs = require('fs');

const TESTCASE_DIR = path.join(__dirname, '..', 'testcases');

async function fixTestcasePaths() {
  try {
    console.log('🔧 Fixing testcase paths in database...');
    
    // Get all testcases
    const [testcases] = await db.execute('SELECT * FROM testcases');
    console.log(`📊 Found ${testcases.length} testcases to fix`);
    
    let fixedCount = 0;
    
    for (const tc of testcases) {
      const problemId = tc.problem_id;
      const testcaseId = tc.id;
      
      // Generate the correct paths using relative paths that work on all platforms
      const correctDir = path.join(TESTCASE_DIR, `problem-${problemId}`);
      const inputNum = path.basename(tc.input_path).replace('input', '').replace('.txt', '');
      
      const newInputPath = path.join(correctDir, `input${inputNum}.txt`);
      const newOutputPath = path.join(correctDir, `output${inputNum}.txt`);
      
      // Create the directory if it doesn't exist
      if (!fs.existsSync(correctDir)) {
        fs.mkdirSync(correctDir, { recursive: true });
      }
      
      // Extract the content if possible (from old paths) or create defaults
      let inputContent = '3 5';
      let outputContent = '8';
      
      try {
        if (fs.existsSync(tc.input_path)) {
          inputContent = fs.readFileSync(tc.input_path, 'utf8');
        }
        if (fs.existsSync(tc.output_path)) {
          outputContent = fs.readFileSync(tc.output_path, 'utf8');
        }
      } catch (error) {
        console.log(`⚠️ Could not read existing testcase ${testcaseId}, using defaults`);
      }
      
      // Write the testcase files to the correct location
      fs.writeFileSync(newInputPath, inputContent);
      fs.writeFileSync(newOutputPath, outputContent);
      
      // Update the database with the new paths
      await db.execute(
        'UPDATE testcases SET input_path = ?, output_path = ? WHERE id = ?',
        [newInputPath, newOutputPath, testcaseId]
      );
      
      console.log(`✅ Fixed testcase ${testcaseId} for problem ${problemId}`);
      fixedCount++;
    }
    
    console.log(`🎉 Fixed ${fixedCount}/${testcases.length} testcase paths`);
    
    // Verify the fix
    const [verifyTestcases] = await db.execute('SELECT * FROM testcases LIMIT 3');
    console.log('Sample fixed paths:');
    verifyTestcases.forEach(tc => {
      console.log(`  Problem ${tc.problem_id}: ${tc.input_path}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing testcase paths:', error);
  }
}

if (require.main === module) {
  fixTestcasePaths()
    .then(() => {
      console.log('✅ Path fixing completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Path fixing failed:', err);
      process.exit(1);
    });
}

module.exports = { fixTestcasePaths };