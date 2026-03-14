import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // In a real app, you might fetch the host from an API or config
    // For now, we'll connect to the window's hostname or a default
    const host = 'http://192.168.0.132:3000';
    // const host = 'localhost:3000'; // Or some other default
    // Using default port or inferring from window.location.port

    const newSocket = io(host, {
      transports: ['websocket'],
      autoConnect: true,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      emit: (event, data) => {
        if (socket) socket.emit(event, data);
      },
      on: (event, callback) => {
        if (socket) socket.on(event, callback);
      },
      off: (event, callback) => {
        if (socket) socket.off(event, callback);
      },
    }),
    [socket, isConnected]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
