import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ setView }) => {

    const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const handleChange = e => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };
  const handleSubmit = async e => {
  e.preventDefault();
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', credentials);
    setMessage(res.data.message || 'Login successful!');
    setSuccess(true);

    // Store token + user info
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('userId', res.data.user.id);
    localStorage.setItem('username', res.data.user.username);

    // Redirect to home
    navigate('/home');
    
  } catch (err) {
    setSuccess(false);
    setMessage(err.response?.data?.message || 'Login failed.');
  }
};

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-3xl font-bold text-center text-white">Log In</h2>

      {message && (
        <div className={`text-sm text-center font-semibold ${success ? 'text-green-400' : 'text-red-500'}`}>
          {message}
        </div>
      )}

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={credentials.email}
        onChange={handleChange}
        className="w-full px-4 py-2 border rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
        required
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        value={credentials.password}
        onChange={handleChange}
        className="w-full px-4 py-2 border rounded-lg bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
        required
      />

      <button
        type="submit"
        className="w-full bg-purple-700 text-white py-2 rounded-lg font-semibold hover:bg-purple-800 transition duration-200"
      >
        Log In
      </button>
    </form>
  );
};

export default Login;
