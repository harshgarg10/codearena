import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const Profile = () => {
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
            headers: {
              Authorization: `Bearer ${token}`,
            },
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      <div className="bg-gray-800 bg-opacity-90 border border-gray-700 shadow-xl rounded-2xl p-8 max-w-2xl w-full backdrop-blur-sm text-white">
        <h2 className="text-3xl font-bold text-purple-400 mb-6 text-center">👤 Your Profile</h2>

        <div className="space-y-4 text-lg">
          <p>
            <span className="text-gray-300">Total Submissions:</span>{' '}
            <span className="font-semibold text-white">{stats.totalSubmissions}</span>
          </p>
          <p>
            <span className="text-gray-300">Accepted Submissions:</span>{' '}
            <span className="font-semibold text-green-400">{stats.acceptedSubmissions}</span>
          </p>
          <p>
            <span className="text-gray-300">Acceptance Rate:</span>{' '}
            <span className="font-semibold text-yellow-300">{stats.acceptanceRate}%</span>
          </p>
        </div>

        <h3 className="mt-8 text-2xl font-semibold text-purple-300 border-b border-gray-700 pb-2">
          📝 Recent Submissions
        </h3>
        <ul className="mt-4 divide-y divide-gray-700">
          {stats.recentSubmissions.map((s, i) => (
            <li key={i} className="py-3">
              <div className="flex justify-between">
                <span className="font-medium text-white">{s.title}</span>
                <span
                  className={`text-sm font-semibold ${
                    s.verdict === 'Accepted' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {s.verdict}
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Submitted at: {new Date(s.submitted_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Profile;
