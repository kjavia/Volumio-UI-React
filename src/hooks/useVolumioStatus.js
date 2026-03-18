import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import useFavourites from './useFavourites';

const useVolumioStatus = () => {
  const { socket, isConnected } = useSocket();
  const { favouritesUris, refetchFavourites } = useFavourites();
  const [status, setStatus] = useState('stop');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [albumart, setAlbumart] = useState('');
  const [volume, setVolume] = useState(0);
  const [mute, setMute] = useState(false);
  const [random, setRandom] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [repeatSingle, setRepeatSingle] = useState(false);
  const [disableVolumeControl, setDisableVolumeControl] = useState(false);
  const [samplerate, setSamplerate] = useState('');
  const [bitdepth, setBitdepth] = useState('');
  const [trackType, setTrackType] = useState('');
  const [bitrate, setBitrate] = useState('');
  const [service, setService] = useState('');
  const [position, setPosition] = useState(0);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handlePushState = (data) => {
      if (!data) return;
      setStatus(data.status);
      setTitle(data.title);
      setArtist(data.artist);
      setAlbum(data.album);
      setAlbumart(data.albumart);
      setVolume(data.volume);
      setMute(data.mute);
      setRandom(data.random);
      setRepeat(data.repeat);
      setRepeatSingle(data.repeatSingle);
      setDisableVolumeControl(data.disableVolumeControl);
      setSamplerate(data.samplerate);
      setBitdepth(data.bitdepth);
      setTrackType(data.trackType || '');
      setBitrate(data.bitrate || '');
      setService(data.service || '');
      if (data.position !== undefined) setPosition(data.position);
    };

    socket.on('pushState', handlePushState);

    const handlePushQueue = (data) => {
      if (Array.isArray(data)) setQueue(data);
    };
    socket.on('pushQueue', handlePushQueue);

    // Initial state request
    socket.emit('getState', '');
    socket.emit('getQueue');

    return () => {
      socket.off('pushState', handlePushState);
      socket.off('pushQueue', handlePushQueue);
    };
  }, [socket]);

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
  const toggleRandom = () => socket.emit('setRandom', { value: !random });
  const toggleRepeat = () => socket.emit('setRepeat', { value: !repeat });

  const setVol = (val) => {
    setVolume(val);
    socket.emit('volume', val);
  };

  const toggleMute = () => {
    const newMute = !mute;
    setMute(newMute);
    socket.emit(newMute ? 'mute' : 'unmute');
  };

  const removeFromQueue = (index) => {
    socket.emit('removeFromQueue', { value: index });
  };

  const playFromQueue = (index) => {
    socket.emit('play', { value: index });
  };

  const toggleFavourite = () => {
    const uri = queue[position]?.uri;
    if (!uri) return;
    if (favouritesUris.has(uri)) {
      socket.emit('removeFromFavourites', { uri, service });
    } else {
      socket.emit('addToFavourites', { uri, title, artist, album, albumart, service });
    }
    // Wait briefly for Volumio to process, then re-fetch authoritative list
    setTimeout(refetchFavourites, 500);
  };

  const isFavourite = Boolean(queue[position]?.uri && favouritesUris.has(queue[position].uri));

  return {
    isConnected,
    status,
    isPlaying: status === 'play',
    title,
    artist,
    album,
    albumart,
    volume,
    mute,
    random,
    repeat,
    repeatSingle,
    disableVolumeControl,
    samplerate,
    bitdepth,
    trackType,
    bitrate,
    service,
    position,
    queue,
    togglePlay,
    next,
    prev,
    setVolume: setVol,
    toggleMute,
    toggleRandom,
    toggleRepeat,
    removeFromQueue,
    playFromQueue,
    isFavourite,
    toggleFavourite,
  };
};

export default useVolumioStatus;
