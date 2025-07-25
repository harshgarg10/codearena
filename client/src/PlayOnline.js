import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { Loader2, XCircle, Users } from 'lucide-react';
import { useSocket } from './context/SocketContext'; 
const PlayOnline = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Click below to find a match');
  const [searching, setSearching] = useState(false);
  const socket = useSocket();
  const username = localStorage.getItem('username') || 'Anonymous';
  const rating = parseInt(localStorage.getItem('rating')) || 1200;

  useEffect(() => {
    if (!socket) return; // Wait for the socket to be available

    const handleMatchFound = ({ roomCode, opponent, problem }) => {
      setStatus(`✅ Matched with ${opponent}. Entering duel room...`);
      setSearching(false);
      
      setTimeout(() => {
        navigate(`/duel/${roomCode}`);
      }, 1000);
    };

    const handleMatchTimeout = () => {
      setStatus("⚠️ No match found. Try again.");
      setSearching(false);
    };

    const handleMatchCancelled = () => {
      setStatus("❌ You left the matchmaking queue.");
      setSearching(false);
    };

    socket.on("match-found", handleMatchFound);
    socket.on("match-timeout", handleMatchTimeout);
    socket.on("match-cancelled", handleMatchCancelled);
    return () => {
      socket.off("match-found", handleMatchFound);
      socket.off("match-timeout", handleMatchTimeout);
      socket.off("match-cancelled", handleMatchCancelled);
    };
  }, [socket, navigate]);
  const findMatch = () => {
    if (socket) {
      setSearching(true);
      setStatus("Searching for opponent...");
      socket.emit("find-match", { username, rating });
    }
  };

  const cancelMatch = () => {
    if (socket) {
      setSearching(false);
      setStatus("Matchmaking cancelled.");
      socket.emit("cancel-matchmaking");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl text-center w-full max-w-md space-y-6 border border-gray-700">
        <h1 className="text-3xl font-bold text-purple-400 flex justify-center items-center gap-2">
          <Users className="w-6 h-6" />
          Online Matchmaking
        </h1>

        <p className="text-lg text-gray-300">{status}</p>

        {searching ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin text-white mx-auto" />
            <button
              onClick={cancelMatch}
              className="mt-4 w-full bg-red-600 hover:bg-red-700 py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Cancel Search
            </button>
          </>
        ) : (
          <button
            onClick={findMatch}
            className="bg-purple-600 hover:bg-purple-700 w-full py-3 rounded-xl text-lg font-bold"
          >
            Find Match
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayOnline;