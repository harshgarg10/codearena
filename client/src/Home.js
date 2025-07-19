import React, { useEffect, useState } from 'react';
import { User, Swords, Users, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { isAuthenticated } from './utils/isAuthenticated';
import { API_ENDPOINTS } from './config/api';
const Home = () => {
  const navigate = useNavigate();
  const [topPlayers, setTopPlayers] = useState([]);
  const [authed, setAuthed] = useState(isAuthenticated()); // Make it state instead of const

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.LEADERBOARD_TOP);
        setTopPlayers(res.data);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      }
    };
    fetchLeaderboard();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    setAuthed(false); // Update the state immediately
    navigate('/login');
  };

  const handleClick = (type) => {
    const currentAuth = isAuthenticated(); // Check current auth status
    if (!currentAuth) {
      navigate('/login');
    } else {
      if (type === 'online') {
        navigate('/play-online');
      } else if (type === 'friend') {
        navigate('/play-with-friend');
      }
    }
  };

  const handleProfileClick = () => {
    const currentAuth = isAuthenticated(); // Check current auth status
    if (!currentAuth) {
      navigate('/login');
    } else {
      navigate('/profile');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-6 py-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-purple-500">AlgoArena</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleProfileClick}
            className="p-2 rounded-full hover:bg-gray-800 transition"
          >
            <User className="w-6 h-6 text-gray-300 hover:text-white" />
          </button>
          {authed && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-gray-800 transition"
              title="Logout"
            >
              <LogOut className="w-6 h-6 text-red-500 hover:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Main Options */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-10 mt-20">
        {/* Play Online */}
        <div
          onClick={() => handleClick('online')}
          className="bg-gradient-to-br from-purple-700 to-purple-800 hover:shadow-purple-500/40 shadow-lg transition hover:scale-105 duration-300 p-8 rounded-xl w-80 text-center cursor-pointer"
        >
          <Swords className="mx-auto h-12 w-12 mb-4 text-white" />
          <h2 className="text-2xl font-semibold mb-1">Play Online</h2>
          <p className="text-sm text-gray-200">Match up with players of similar skill</p>
        </div>

        {/* Play With a Friend */}
        <div
          onClick={() => handleClick('friend')}
          className="bg-gradient-to-br from-gray-700 to-gray-800 hover:shadow-gray-500/40 shadow-lg transition hover:scale-105 duration-300 p-8 rounded-xl w-80 text-center cursor-pointer"
        >
          <Users className="mx-auto h-12 w-12 mb-4 text-white" />
          <h2 className="text-2xl font-semibold mb-1">Play with a Friend</h2>
          <p className="text-sm text-gray-300">Invite a friend for a friendly duel</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mt-12 w-full max-w-3xl mx-auto bg-gray-800 rounded-xl overflow-hidden shadow-lg">
        <h2 className="text-2xl font-semibold text-center text-white py-4 border-b border-gray-700">
          🏆 Top Players
        </h2>
        <ul className="divide-y divide-gray-700">
          {topPlayers.map((player, index) => (
            <li key={index} className="flex items-center justify-between px-6 py-4 text-white">
              <span className="flex items-center gap-3">
                <span className="text-yellow-400 font-bold">{index + 1}.</span>
                <span>{player.username}</span>
              </span>
              <span className="text-purple-400 font-medium">{player.rating}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;