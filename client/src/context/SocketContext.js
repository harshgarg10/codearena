import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { API_ENDPOINTS } from '../config/api';
const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Establish a single socket connection when the provider mounts
    const newSocket = io(API_ENDPOINTS.SOCKET_URL, {
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Persistent socket connected:', newSocket.id);
    });

    setSocket(newSocket);

    // Disconnect the socket when the provider unmounts (e.g., user closes the app)
    return () => {
      console.log('🔌 Disconnecting persistent socket.');
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};