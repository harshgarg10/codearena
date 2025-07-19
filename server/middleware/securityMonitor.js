const fs = require('fs');
const path = require('path');

const securityLogger = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /testcase/i,
    /\.txt$/,
    /input\d/,
    /output\d/,
    /temp/,
    /file:\/\//,
    /__dirname/,
    /process\.env/
  ];
  
  const url = req.url.toLowerCase();
  
  // 🔧 FIX: Safely handle req.body that might be undefined
  const body = req.body ? JSON.stringify(req.body).toLowerCase() : '';
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(body)
  );
  
  if (isSuspicious) {
    console.log(`🚨 SECURITY ALERT: Suspicious request detected`);
    console.log(`   IP: ${req.ip}`);
    console.log(`   URL: ${req.url}`);
    console.log(`   User-Agent: ${req.get('User-Agent')}`);
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Log to file for analysis
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent'),
      body: req.body || null // 🔧 FIX: Handle undefined body
    };
    
    const logFile = path.join(logsDir, 'security.log');
    try {
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (writeError) {
      console.error('Failed to write security log:', writeError.message);
    }
  }
  
  next();
};

module.exports = { securityLogger };