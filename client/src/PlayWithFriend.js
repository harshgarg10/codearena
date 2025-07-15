import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { ArrowRight, Users, Copy } from 'lucide-react';

const PlayWithFriend = () => {
  const [roomCode, setRoomCode] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [status, setStatus] = useState('Not connected');
  const [username] = useState(localStorage.getItem('username') || 'Anonymous');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Create socket connection inside the component
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Connected to Socket.io with ID:', newSocket.id);
      setStatus('Connected');
    });

    newSocket.on('room-created', ({ roomCode }) => {
      setRoomCode(roomCode);
      setStatus(`Room created! Waiting for friend...`);
    });

    newSocket.on('room-update', ({ message, players }) => {
      setStatus(`${message}. Players in room: ${players.length}`);
      if (players.length === 2) {
        setStatus('Both players joined! Starting the duel...');
        // TODO: trigger start duel logic
      }
    });

    newSocket.on('join-error', (errMsg) => {
      setStatus(`Error: ${errMsg}`);
    });

    // Cleanup on component unmount
    return () => {
      newSocket.off('connect');
      newSocket.off('room-created');
      newSocket.off('room-update');
      newSocket.off('join-error');
      newSocket.disconnect();
    };
  }, []);

  const createRoom = () => {
    if (socket) {
      setIsHost(true);
      socket.emit('create-room', { username });
    }
  };

  const joinRoom = () => {
    if (roomInput.trim() !== '' && socket) {
      socket.emit('join-room', { roomCode: roomInput.toUpperCase(), username });
      setStatus('Attempting to join...');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white px-4 py-10 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6 border border-gray-700">
        <h1 className="text-3xl font-extrabold text-purple-400 text-center flex items-center justify-center gap-2">
          <Users className="w-7 h-7" />
          Play With a Friend
        </h1>

        {!roomCode || !isHost ? (
          <div className="space-y-8">
            <button
              onClick={createRoom}
              className="w-full bg-purple-600 hover:bg-purple-700 transition-all duration-200 px-6 py-3 rounded-xl font-semibold text-lg shadow-md"
            >
              Create Room
            </button>

            <div className="relative">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-700 text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={joinRoom}
                className="mt-4 w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 transition-all duration-200 px-6 py-3 rounded-xl font-semibold text-lg shadow"
              >
                Join Room
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-sm text-center ${status.includes('Error') ? 'text-red-400' : 'text-gray-300'}`}>
              {status}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-5">
            <p className="text-xl font-semibold text-gray-300">Share this code with your friend:</p>
            <div className="flex items-center justify-center gap-3">
              <span className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-xl font-mono tracking-widest">
                {roomCode}
              </span>
              <button onClick={copyToClipboard} className="text-yellow-300 hover:text-yellow-400 transition">
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-sm ${status.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {status}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayWithFriend;