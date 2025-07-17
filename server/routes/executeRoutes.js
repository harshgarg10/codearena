const express = require('express');
const router = express.Router();

// Mock code execution for custom input
router.post('/custom', (req, res) => {
  const { code, input } = req.body;
  
  // This is a mock implementation - in a real app you'd run the code in a sandbox
  try {
    // For demo purposes, just return the input as output
    const output = `Mock output for input: ${input}\nCode length: ${code.length} characters`;
    res.json({ output });
  } catch (error) {
    res.status(500).json({ output: 'Execution error: ' + error.message });
  }
});

// Mock code execution for submission
router.post('/submit', (req, res) => {
  const { code, problemId, username } = req.body;
  
  // This is a mock implementation - in a real app you'd test against test cases
  try {
    // For demo purposes, randomly pass/fail some test cases
    const total = 5;
    const passed = Math.floor(Math.random() * (total + 1));
    
    res.json({ passed, total });
  } catch (error) {
    res.status(500).json({ passed: 0, total: 5, error: error.message });
  }
});

module.exports = router;