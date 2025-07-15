import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './Home';
import PlayOnline from './PlayOnline';
import PlayWithFriend from './PlayWithFriend';
import LoginSignup from './LoginSignup';
import Profile from './Profile';
import ProtectedRoute from './components/ProtectedRoute';
import { isAuthenticated } from './utils/isAuthenticated';

function App() {
  const [authed, setAuthed] = useState(isAuthenticated());

  // Listen for storage changes to update authentication state
  useEffect(() => {
    const handleStorageChange = () => {
      setAuthed(isAuthenticated());
    };

    // Listen for changes in localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically in case of same-tab changes
    const interval = setInterval(() => {
      const currentAuth = isAuthenticated();
      if (currentAuth !== authed) {
        setAuthed(currentAuth);
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [authed]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={<Home />} />
      <Route 
        path="/login" 
        element={!authed ? <LoginSignup /> : <Navigate to="/home" />} 
      />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/play-online" element={<PlayOnline />} />
        <Route path="/play-with-friend" element={<PlayWithFriend />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;