import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';
import { VOLUMIO_BASE_URL } from '@/config';

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(VOLUMIO_BASE_URL, {
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
