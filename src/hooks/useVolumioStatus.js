import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

const useVolumioStatus = () => {
  const { socket, isConnected } = useSocket();
  const [status, setStatus] = useState('stop');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [albumart, setAlbumart] = useState('');
  const [seek, setSeek] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0);
  const [mute, setMute] = useState(false);
  const [samplerate, setSamplerate] = useState('');
  const [bitdepth, setBitdepth] = useState('');

  useEffect(() => {
    if (!socket) return;

    const handlePushState = (data) => {
      if (!data) return;
      setStatus(data.status);
      setTitle(data.title);
      setArtist(data.artist);
      setAlbum(data.album);
      setAlbumart(data.albumart);
      setSeek(data.seek); // Seek is in milliseconds usually
      setDuration(data.duration);
      setVolume(data.volume);
      setMute(data.mute);
      setSamplerate(data.samplerate);
      setBitdepth(data.bitdepth); // or check exact key
    };

    socket.on('pushState', handlePushState);
    // Initial state request
    socket.emit('getState', '');

    return () => {
      socket.off('pushState', handlePushState);
    };
  }, [socket]);

  // Update seek periodically when playing to make UI fluid
  useEffect(() => {
    let interval;
    if (status === 'play') {
      interval = setInterval(() => {
        setSeek((prev) => prev + 1000); // Add 1 second every second
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Action handlers
  const togglePlay = () => {
    if (status === 'play') {
      socket.emit('pause');
    } else {
      socket.emit('play');
    }
  };

  const next = () => socket.emit('next');
  const prev = () => socket.emit('prev');
  const stop = () => socket.emit('stop');
  const setVol = (val) => socket.emit('volume', val);
  const toggleMute = () => socket.emit('volume', mute ? 'unmute' : 'mute');

  // Seek expects seconds usually for Volumio but UI might use ms.
  // Volumio `seek` command expects seconds
  const seekTo = (val) => {
    socket.emit('seek', val);
    setSeek(val * 1000); // Optimistic update
  };

  return {
    isConnected,
    status,
    isPlaying: status === 'play',
    title,
    artist,
    album,
    albumart,
    seek,
    duration,
    volume,
    mute,
    samplerate,
    bitdepth,
    togglePlay,
    next,
    prev,
    stop,
    setVolume: setVol,
    toggleMute,
    seekTo,
  };
};

export default useVolumioStatus;
