import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { User, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please log in.');
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          setError('Token expired. Please log in again.');
          localStorage.clear();
          return;
        }

        axios
          .get(`http://localhost:5000/api/profile/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => setStats(res.data))
          .catch((err) => {
            console.error('Profile fetch error:', err);
            setError(err.response?.data?.message || 'Failed to fetch profile.');
            if (err.response?.status === 401 || err.response?.status === 403) {
              localStorage.clear();
            }
          });
      } catch (err) {
        console.error('Token decoding error:', err);
        setError('Invalid token. Please log in again.');
        localStorage.clear();
      }
    };

    fetchProfile();
  }, []);

  if (error)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-500 text-lg p-6">
        {error}
      </div>
    );

  if (!stats)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white text-lg p-6">
        Loading profile...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-10">
      {/* Header with Back to Home */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 shadow-xl ring-4 ring-purple-400/40 flex items-center justify-center text-4xl font-extrabold uppercase tracking-wide">
            {stats.username?.[0] || <User />}
          </div>
          <div>
            <h1 className="text-4xl font-bold">{stats.username}</h1>
            <p className="mt-2 text-lg text-purple-300 font-medium">
              🏆 Rating: <span className="text-white">{stats.rating}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/home')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow-md transition duration-200"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium">Home</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700 text-center">
          <p className="text-sm text-gray-400">Total Duels</p>
          <h3 className="text-2xl font-bold">{stats.totalDuels || 0}</h3>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700 text-center">
          <p className="text-sm text-gray-400">Wins</p>
          <h3 className="text-2xl font-bold text-green-400">{stats.wins || 0}</h3>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700 text-center">
          <p className="text-sm text-gray-400">Losses</p>
          <h3 className="text-2xl font-bold text-red-400">{stats.losses || 0}</h3>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700 text-center">
          <p className="text-sm text-gray-400">Win Rate</p>
          <h3 className="text-2xl font-bold text-yellow-300">{stats.winRate || 0}%</h3>
        </div>
      </div>

      {/* Recent Duels */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
        <h3 className="text-2xl font-semibold text-purple-300 mb-4">⚔️ Recent Duels</h3>
        {!stats.recentDuels || stats.recentDuels.length === 0 ? (
          <p className="text-gray-400 text-sm">No duels yet.</p>
        ) : (
          <ul className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
            {stats.recentDuels.map((duel, i) => (
              <li key={i} className="py-3 text-sm sm:text-base">
                <div className="flex justify-between items-center">
                  <span className="font-medium">vs {duel.opponent}</span>
                  <span
                    className={`text-xs font-semibold ${
                      duel.result === 'Won' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {duel.result}
                  </span>
                </div>
                <p className="text-gray-400 text-xs">Problem: {duel.problem}</p>
                <p className="text-gray-400 text-xs">
                  {new Date(duel.ended_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Profile;
