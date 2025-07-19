
/**
 * Remove sensitive file paths and internal data from responses
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
const sanitizeResponse = (data) => {
  if (!data) return data;
  
  // Remove file paths and sensitive fields
  const sensitiveFields = [
    'input_path', 
    'output_path', 
    'file_path',
    'temp_dir',
    'testcase_dir'
  ];
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponse(item));
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const sanitized = { ...data };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    });
    
    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeResponse(sanitized[key]);
      }
    });
    
    return sanitized;
  }
  
  return data;
};

module.exports = { sanitizeResponse };