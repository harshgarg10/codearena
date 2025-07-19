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
    // Resolve the absolute path
    const resolvedPath = path.resolve(filePath);
    const allowedRoot = path.resolve(TESTCASE_DIR);
    
    // Ensure the file is within the testcase directory
    if (!resolvedPath.startsWith(allowedRoot)) {
      throw new Error(`🚨 Security violation: File outside testcase directory`);
    }
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`📁 File not found: ${path.basename(filePath)}`);
    }
    
    // Additional check for file extension
    const ext = path.extname(resolvedPath).toLowerCase();
    if (ext !== '.txt') {
      throw new Error(`🚨 Security violation: Invalid file type`);
    }
    
    // Read and return file content
    return fs.readFileSync(resolvedPath, 'utf-8');
    
  } catch (error) {
    console.error(`🔒 Secure file read failed:`, error.message);
    throw error;
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