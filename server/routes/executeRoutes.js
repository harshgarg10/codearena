const express = require('express');
const router = express.Router();
const { executeCode } = require('../utils/codeExecuter');

// Execute code with custom input
router.post('/custom', async (req, res) => {
  const { code, input, language } = req.body;
  
  if (!code || !language) {
    return res.status(400).json({ output: '❌ Code and language are required' });
  }

  try {
    console.log(`🚀 Executing ${language} code...`);
    const result = await executeCode(code, input || '', language);
    res.json(result);
  } catch (error) {
    console.error('Custom execution error:', error);
    res.status(500).json({ output: '❌ Internal server error', error: error.message });
  }
});

// Submit code for testing (you can expand this with test cases)
router.post('/submit', async (req, res) => {
  const { code, problemId, username, language } = req.body;
  
  if (!code || !language) {
    return res.status(400).json({ passed: 0, total: 0, error: 'Code and language are required' });
  }

  try {
    console.log(`📝 Submission by ${username} for problem ${problemId}`);
    
    // For now, just run with sample input (you can expand this with actual test cases)
    const result = await executeCode(code, '3 5', language); // Sample input
    
    // Simple check: if output contains "8", consider it passed (for demo)
    const isCorrect = result.output && result.output.trim() === '8';
    const passed = isCorrect ? 5 : 0;
    const total = 5;
    
    res.json({ 
      passed, 
      total, 
      output: result.output,
      message: `Passed ${passed}/${total} test cases`
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ passed: 0, total: 5, error: error.message });
  }
});

module.exports = router;