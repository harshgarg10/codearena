// Detect environment based on current hostname
const isDevelopment = window.location.hostname === 'localhost';

// Select API base URL based on environment
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000' 
  : 'https://codearena-backend-z4dx.onrender.com';

export const API_ENDPOINTS = {
  // Auth endpoints
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  PROTECTED: `${API_BASE_URL}/api/auth/protected`,
  
  // Profile endpoints
  PROFILE_STATS: `${API_BASE_URL}/api/profile/stats`,
  
  // Leaderboard
  LEADERBOARD_TOP: `${API_BASE_URL}/api/leaderboard/top`,
  
  // Code execution
  EXECUTE_CUSTOM: `${API_BASE_URL}/api/execute/custom`,
  EXECUTE_SUBMIT: `${API_BASE_URL}/api/execute/submit`,
  
  // Socket.io
  SOCKET_URL: API_BASE_URL
};

// Log the selected API configuration
console.log(`🌍 Environment: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
console.log('🔌 API_BASE_URL:', API_BASE_URL);
console.log('🔐 LOGIN endpoint:', API_ENDPOINTS.LOGIN);

export default API_BASE_URL;