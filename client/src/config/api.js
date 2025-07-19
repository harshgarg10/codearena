const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

export default API_BASE_URL;