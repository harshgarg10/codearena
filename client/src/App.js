import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import PlayOnline from './PlayOnline';
import PlayWithFriend from './PlayWithFriend';
import LoginSignup from './LoginSignup';
import Profile from './Profile';
import ProtectedRoute from './components/ProtectedRoute'; // Assuming you create this file
import { isAuthenticated } from './utils/isAuthenticated';

function App() {
  const authed = isAuthenticated();

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