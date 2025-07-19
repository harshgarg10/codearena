import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { User, Home, Trophy, Target, Clock } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS } from './config/api';
const Profile = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setError('No authentication token found. Please log in.');
            return;
          }

          const decoded = jwtDecode(token);
          axios.get(API_ENDPOINTS.PROFILE_STATS, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
              console.log('📊 Profile data received:', response.data);
              
              // Debug the recent duels data
              if (response.data.recentDuels) {
                console.log('🔍 Recent duels debug:', response.data.recentDuels.map(duel => ({
                  opponent: duel.opponent,
                  your_time: duel.your_time,
                  your_time_type: typeof duel.your_time,
                  problem: duel.problem_title
                })));
              }
              
              setStats(response.data);
            })
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || timeInSeconds === 0 || timeInSeconds === '0') return 'N/A';
    const numericTime = typeof timeInSeconds === 'string' ? parseFloat(timeInSeconds) : timeInSeconds;
    if (isNaN(numericTime) || numericTime <= 0) return 'N/A';
    return `${numericTime.toFixed(2)}s`;
  };

  if (error)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-500 text-lg p-6">
        {error}
      </div>
    );

  if (!stats)
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white text-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
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
          <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
          <p className="text-sm text-gray-400">Total Duels</p>
          <h3 className="text-2xl font-bold">{stats.totalDuels || 0}</h3>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700 text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-green-400" />
          <p className="text-sm text-gray-400">Wins</p>
          <h3 className="text-2xl font-bold text-green-400">{stats.wins || 0}</h3>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700 text-center">
          <div className="w-8 h-8 mx-auto mb-2 bg-red-400 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">L</span>
          </div>
          <p className="text-sm text-gray-400">Losses</p>
          <h3 className="text-2xl font-bold text-red-400">{stats.losses || 0}</h3>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700 text-center">
          <div className="w-8 h-8 mx-auto mb-2 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-gray-900">%</span>
          </div>
          <p className="text-sm text-gray-400">Win Rate</p>
          <h3 className="text-2xl font-bold text-yellow-300">{stats.winRate || 0}%</h3>
        </div>
      </div>

      {/* Recent Duels */}
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
        <h3 className="text-2xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
          ⚔️ Recent Duels
        </h3>
        {!stats.recentDuels || stats.recentDuels.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg">No duels yet.</p>
            <p className="text-gray-500 text-sm">Start your first duel to see your history here!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentDuels.map((duel, i) => (
              <div key={i} className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition">
                // In the recent duels display section, add ranked indicator:
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      duel.result === 'Won' ? 'bg-green-400' : 
                      duel.result === 'Draw' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                    <span className="font-medium text-white">vs {duel.opponent}</span>
                    {!duel.is_ranked && (
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        Friendly
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-semibold px-2 py-1 rounded ${
                    duel.result === 'Won' ? 'bg-green-900 text-green-300' : 
                    duel.result === 'Draw' ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {duel.result}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">📋</span>
                    <span className="text-gray-300">{duel.problem_title || 'Unknown Problem'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">📊</span>
                    <span className="text-gray-300">Score: {duel.your_score || 0} vs {duel.opponent_score || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">{formatTime(duel.your_time)}</span>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  {formatDate(duel.ended_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Stats Section */}
      {(stats.totalSubmissions > 0) && (
        <div className="mt-8 bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
          <h3 className="text-2xl font-semibold text-purple-300 mb-4">📈 Submission Stats</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-400">Total Submissions</p>
              <h3 className="text-xl font-bold">{stats.totalSubmissions}</h3>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Accepted</p>
              <h3 className="text-xl font-bold text-green-400">{stats.acceptedSubmissions}</h3>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Acceptance Rate</p>
              <h3 className="text-xl font-bold text-blue-400">{stats.acceptanceRate}%</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;