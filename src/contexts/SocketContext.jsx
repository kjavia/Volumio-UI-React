/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';
import { VOLUMIO_BASE_URL } from '@/config';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  // Lazy initializer creates the socket once — avoids calling setState inside an effect
  const [socket] = useState(() => io(VOLUMIO_BASE_URL, {
    transports: ['websocket'],
    autoConnect: true,
  }));
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Re-connect if the socket was disconnected by a previous cleanup
    // (e.g. React Strict Mode double-invocation)
    if (!socket.connected) socket.connect();

    const handleConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
    };
    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    };
    const handleError = (err) => {
      console.error('Socket connection error:', err);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
      socket.disconnect();
    };
  }, [socket]);

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
