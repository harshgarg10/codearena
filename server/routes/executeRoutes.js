const express = require('express');
const router = express.Router();
const { executeCode } = require('../utils/codeExecuter');
const { evaluateSubmission } = require('../utils/evaluateSubmission');

// Route 1️⃣: Run Custom Input (like "Run Code" button)
router.post('/custom', async (req, res) => {
  const { code, input, language } = req.body;
  
  if (!code || !language) {
    return res.status(400).json({ output: '❌ Code and language are required' });
  }

  try {
    console.log(`⚙️ Running ${language} code with custom input`);
    const result = await executeCode(code, input || '', language);
    
    // Handle the new result format from codeExecuter
    if (result.verdict === 'Success') {
      res.json({ 
        output: result.output,
        time: result.time,
        verdict: result.verdict
      });
    } else {
      res.json({ 
        output: `❌ ${result.verdict}: ${result.output}`,
        time: result.time,
        verdict: result.verdict
      });
    }
  } catch (error) {
    console.error('Custom execution error:', error);
    res.status(500).json({ output: '❌ Internal server error', error: error.message });
  }
});

// Route 2️⃣: Full Submission — Run on all real testcases, calculate score
router.post('/submit', async (req, res) => {
  const { code, problemId, username, language = 'cpp', duelId = null } = req.body;

  if (!code || !language || !problemId || !username) {
    return res.status(400).json({ 
      error: 'Missing required submission fields',
      passed: 0,
      total: 0 
    });
  }

  try {
    console.log(`📩 Submission received from "${username}" for problem ${problemId}`);
    
    const result = await evaluateSubmission({ code, language, username, problemId, duelId });

    res.json({
      verdict: result.verdict,
      passed: result.passed,
      total: result.total,
      score: result.score,
      time: result.time,
      message: `${result.verdict}: Passed ${result.passed}/${result.total} testcases`
    });

  } catch (error) {
    console.error('❌ Submission evaluation failed:', error);
    res.status(500).json({
      error: error.message,
      message: 'Something went wrong while evaluating the submission.',
      passed: 0,
      total: 0
    });
  }
});

module.exports = router;