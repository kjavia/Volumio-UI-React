import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import useFavourites from './useFavourites';

/**
 * Normalize URI for comparison between queue and favorites
 * Queue URIs often have different prefixes than favorites
 * e.g., "music-library/NAS/..." vs "mnt/NAS/..."
 */
const normalizeUri = (uri) => {
  if (!uri) return '';
  // Remove common prefixes to get the comparable part
  return uri
    .replace(/^music-library\//, '')
    .replace(/^mnt\//, '')
    .replace(/^\/mnt\//, '');
};

/**
 * Check if a URI is in the favorites set, accounting for different prefixes
 */
const isUriInFavourites = (uri, favouritesSet) => {
  if (!uri || !favouritesSet) return false;

  // First try exact match
  if (favouritesSet.has(uri)) return true;

  // Try normalized comparison
  const normalizedUri = normalizeUri(uri);
  for (const favUri of favouritesSet) {
    if (normalizeUri(favUri) === normalizedUri) {
      return true;
    }
  }

  return false;
};

/**
 * Find the actual favorite URI that matches the given URI
 * Returns null if not found
 */
const findMatchingFavouriteUri = (uri, favouritesSet) => {
  if (!uri || !favouritesSet) return null;

  // First try exact match
  if (favouritesSet.has(uri)) return uri;

  // Try normalized comparison to find the matching favorite
  const normalizedUri = normalizeUri(uri);
  for (const favUri of favouritesSet) {
    if (normalizeUri(favUri) === normalizedUri) {
      return favUri;
    }
  }

  return null;
};

const useVolumioStatus = () => {
  const { socket, isConnected } = useSocket();
  const { favouritesUris, refetchFavourites, addFavouriteOptimistic, removeFavouriteOptimistic } =
    useFavourites();
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
      console.log('[VolumioStatus] Received pushState:', data);
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
    const isFav = isUriInFavourites(uri, favouritesUris);

    if (!uri) return;

    // Optimistically update the UI immediately
    if (isFav) {
      // When removing, we need to find and use the actual favorite URI
      // (not the queue URI) because they may have different prefixes
      const actualFavouriteUri = findMatchingFavouriteUri(uri, favouritesUris);

      console.log('[Favourites] Removing from favourites:', {
        queueUri: uri,
        actualFavouriteUri,
        service,
      });

      if (actualFavouriteUri) {
        removeFavouriteOptimistic(actualFavouriteUri);
        socket.emit('removeFromFavourites', { uri: actualFavouriteUri, service });
      } else {
        console.error('[Favourites] Could not find matching favourite URI to remove');
      }
    } else {
      console.log('[Favourites] Adding to favourites:', {
        uri,
        service,
      });

      addFavouriteOptimistic(uri);
      socket.emit('addToFavourites', { uri, title, artist, album, albumart, service });
    }

    // Re-fetch authoritative list after a delay to ensure server has processed
    setTimeout(refetchFavourites, 500);
  };

  const isFavourite = isUriInFavourites(queue[position]?.uri, favouritesUris);

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
