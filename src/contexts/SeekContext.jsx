import { createContext, useContext, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSocket } from './SocketContext';

const SeekContext = createContext(null);

export const SeekProvider = ({ children }) => {
  const { socket } = useSocket();
  const [seek, setSeek] = useState(0);
  const [duration, setDuration] = useState(0);
  const workerRef = useRef(null);

  // Create the Web Worker once on mount — runs on a separate thread,
  // immune to browser tab throttling that would degrade setInterval accuracy.
  useEffect(() => {
    const worker = new Worker(new URL('../utils/seekTimerWorker.js', import.meta.url));
    worker.onmessage = (e) => {
      if (e.data.event === 'seek') {
        setSeek(e.data.seek);
      }
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handlePushState = (data) => {
      if (!data) return;
      const seekVal = data.seek || 0;
      const maxVal = (data.duration || 0) * 1000;
      setDuration(data.duration);
      setSeek(seekVal);

      const worker = workerRef.current;
      if (!worker) return;

      switch (data.status) {
        case 'play':
          worker.postMessage({ command: 'start', beginSeek: seekVal, max: maxVal });
          break;
        case 'pause':
          worker.postMessage({ command: 'pause', pauseSeek: seekVal, max: maxVal });
          break;
        case 'stop':
          worker.postMessage({ command: 'stop' });
          break;
        default:
          break;
      }
    };

    socket.on('pushState', handlePushState);

    return () => {
      socket.off('pushState', handlePushState);
    };
  }, [socket]);

  const seekTo = (val) => {
    if (!socket) return;
    socket.emit('seek', val);
    // Optimistic update — also restart the worker from new position
    const seekMs = val * 1000;
    setSeek(seekMs);
    if (workerRef.current) {
      workerRef.current.postMessage({ command: 'start', beginSeek: seekMs, max: duration * 1000 });
    }
  };

  const refreshState = () => {
    if (!socket) return;
    socket.emit('getState', '');
  };

  return <SeekContext.Provider value={{ seek, duration, seekTo, refreshState }}>{children}</SeekContext.Provider>;
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
