import React, { useState } from 'react';
import axios from 'axios';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', formData);
      setMessage(res.data.message);
      localStorage.setItem('token', res.data.token);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Signup failed.');
    }
  };

  return (
    
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-3xl font-bold text-center text-white-800">Sign Up</h2>

      {message && (
        <div className="text-sm text-center text-purple-700 font-semibold">
          {message}
        </div>
      )}

      <input
        type="text"
        name="username"
        placeholder="Username"
        value={formData.username}
        onChange={handleChange}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
        required
      />

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
        required
      />

      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
        required
      />

      <button
        type="submit"
        className="w-full bg-purple-700 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition duration-200"
      >
        Sign Up
      </button>
    </form>
  );
};

export default Signup;
