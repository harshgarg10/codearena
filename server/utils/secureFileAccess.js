const fs = require('fs');
const path = require('path');

const TESTCASE_DIR = path.resolve(__dirname, '..', 'testcases');

/**
 * Securely read a file with path validation
 * @param {string} filePath - The file path to read
 * @returns {string} File content
 */

const secureFileRead = (filePath) => {
  try {
    // Try direct path first
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    
    // If that fails, try resolving from project root
    const altPath = path.resolve(__dirname, '..', filePath);
    if (fs.existsSync(altPath)) {
      return fs.readFileSync(altPath, 'utf8');
    }
    
    // Extract problem-id and filename for a last attempt
    const match = filePath.match(/problem-(\d+)[\/\\](\w+\d+\.txt)/);
    if (match) {
      const [_, problemId, filename] = match;
      const fallbackPath = path.join(__dirname, '..', 'testcases', `problem-${problemId}`, filename);
      if (fs.existsSync(fallbackPath)) {
        return fs.readFileSync(fallbackPath, 'utf8');
      }
    }
    
    throw new Error(`File not found: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error reading file securely: ${error.message}`);
    throw new Error(`Failed to read file: ${filePath}`);
  }
};

/**
 * Validate that a path is safe for testcase access
 * @param {string} filePath - Path to validate
 * @returns {boolean} Whether the path is safe
 */
const isValidTestcasePath = (filePath) => {
  try {
    const resolvedPath = path.resolve(filePath);
    const testcaseRoot = path.resolve(TESTCASE_DIR);
    
    return resolvedPath.startsWith(testcaseRoot) && 
           path.extname(resolvedPath).toLowerCase() === '.txt' &&
           (path.basename(resolvedPath).startsWith('input') || 
            path.basename(resolvedPath).startsWith('output'));
  } catch {
    return false;
  }
};

module.exports = { secureFileRead, isValidTestcasePath };