import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSocket } from './SocketContext';

const SeekContext = createContext(null);

export const SeekProvider = ({ children }) => {
  const { socket } = useSocket();
  const [seek, setSeek] = useState(0);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState('stop');

  useEffect(() => {
    if (!socket) return;

    const handlePushState = (data) => {
      if (!data) return;
      setSeek(data.seek);
      setDuration(data.duration);
      setStatus(data.status);
    };

    socket.on('pushState', handlePushState);

    return () => {
      socket.off('pushState', handlePushState);
    };
  }, [socket]);

  // Update seek periodically when playing to make UI fluid
  // Skip for web radio (duration === 0) and stop when seek reaches duration
  useEffect(() => {
    let interval;
    if (status === 'play' && duration > 0) {
      interval = setInterval(() => {
        setSeek((prev) => {
          const next = prev + 1000;
          return next <= duration * 1000 ? next : prev;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, duration]);

  const seekTo = (val) => {
    if (!socket) return;
    socket.emit('seek', val);
    setSeek(val * 1000); // Optimistic update
  };

  return <SeekContext.Provider value={{ seek, duration, seekTo }}>{children}</SeekContext.Provider>;
};

SeekProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSeek = () => {
  const context = useContext(SeekContext);
  if (!context) {
    throw new Error('useSeek must be used within a SeekProvider');
  }
  return context;
};
