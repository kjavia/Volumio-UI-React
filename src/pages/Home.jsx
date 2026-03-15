import React, { useMemo, useState, useRef, useEffect } from 'react';
import useVolumioStatus from '@/hooks/useVolumioStatus';
import usePluginConfig from '@/hooks/usePluginConfig';
import { VOLUMIO_BASE_URL, SPECTRUM_STREAM_URL } from '@/config';
import AlbumArtPlayer from '@/components/animated-players/AlbumArtPlayer';
import VinylPlayer from '@/components/animated-players/VinylPlayer';
import VinylCoverPlayer from '@/components/animated-players/VinylCoverPlayer';
import CdPlayer from '@/components/animated-players/CdPlayer';
import CdCoverPlayer from '@/components/animated-players/CdCoverPlayer';
import CassettePlayer from '@/components/animated-players/CassettePlayer';
import ReelToReelPlayer from '@/components/animated-players/ReelToReelPlayer';
import RadioPlayer from '@/components/animated-players/RadioPlayer';
import PlayerControls from '@/components/PlayerControls';
import TrackInfo from '@/components/TrackInfo';
import PlayerSeekbar from '@/components/PlayerSeekbar';
import VolumeManager from '@/components/VolumeManager';
import SpectrumAnalyzer from '@/components/spectrum-analyzers/SpectrumAnalyzer';
import StreamInfo from '@/components/StreamInfo';
import Playlist from '@/components/Playlist';
import DisconnectedScreen from '@/components/DisconnectedScreen';

const PLAYER_MAP = {
  albumArt: AlbumArtPlayer,
  vinyl: VinylPlayer,
  vinylCover: VinylCoverPlayer,
  cd: CdPlayer,
  cdCover: CdCoverPlayer,
  cassette: CassettePlayer,
  reelToReel: ReelToReelPlayer,
  radio: RadioPlayer,
};

const RANDOM_PLAYERS = [
  VinylPlayer,
  VinylCoverPlayer,
  CdPlayer,
  CdCoverPlayer,
  CassettePlayer,
  ReelToReelPlayer,
  RadioPlayer,
  AlbumArtPlayer,
];

const Home = () => {
  const { data: pluginConfig } = usePluginConfig();
  console.log('Plugin config:', pluginConfig);
  const playerType = pluginConfig?.playerType || 'radio';

  const {
    isConnected,
    isPlaying,
    title,
    artist,
    album,
    albumart,
    seek,
    duration,
    volume,
    mute,
    togglePlay,
    next,
    prev,
    seekTo,
    setVolume,
    toggleMute,
    random,
    repeat,
    toggleRandom,
    toggleRepeat,
    disableVolumeControl,
    samplerate,
    bitdepth,
    trackType,
    bitrate,
    service,
    position,
    queue,
    removeFromQueue,
    playFromQueue,
    isFavourite,
    toggleFavourite,
  } = useVolumioStatus();

  const [cycleIndex, setCycleIndex] = useState(null);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const touchTimer = useRef(null);

  // Reset manual cycle when the config setting changes
  useEffect(() => {
    setCycleIndex(null);
  }, [playerType]);

  const cyclePlayer = () => {
    setCycleIndex((prev) => {
      const currentIdx = prev !== null ? prev : RANDOM_PLAYERS.indexOf(PLAYER_MAP[playerType]);
      return (currentIdx + 1) % RANDOM_PLAYERS.length;
    });
  };

  const handleTouchStart = () => {
    touchTimer.current = setTimeout(() => {
      cyclePlayer();
    }, 800); // 800ms for long press
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
    }
  };

  const CurrentPlayerComponent =
    cycleIndex !== null
      ? RANDOM_PLAYERS[cycleIndex]
      : playerType === 'random'
        ? RANDOM_PLAYERS[0]
        : PLAYER_MAP[playerType] || AlbumArtPlayer;

  // Construct full album art URL
  const fullAlbumArt = useMemo(() => {
    if (!albumart) return '';
    if (albumart.startsWith('http')) return albumart;
    return `${VOLUMIO_BASE_URL}${albumart}`;
  }, [albumart]);

  // After 5 minutes of no connection, stop showing the retrying state
  const [isRetrying, setIsRetrying] = useState(true);
  useEffect(() => {
    if (isConnected) {
      setIsRetrying(true);
      return;
    }
    const timer = setTimeout(() => setIsRetrying(false), 5 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [isConnected]);

  if (!isConnected) {
    return <DisconnectedScreen isRetrying={isRetrying} host={VOLUMIO_BASE_URL} />;
  }

  return (
    <div className="container-fluid h-100 bg-dark overflow-hidden position-relative p-0 w-100">
      {/* Optional Background Blur */}
      {fullAlbumArt && (
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            backgroundImage: `url(${fullAlbumArt})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(80px) brightness(0.3)',
            zIndex: 0,
          }}
        />
      )}

      {/* Main Grid Layout */}
      <div className="home-grid position-relative" style={{ zIndex: 1 }}>
        {/* PLAYER SECTION */}
        <div className="home-panel area-player">
          <div
            className="player-responsive"
            onDoubleClick={cyclePlayer}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            <CurrentPlayerComponent
              isPlaying={isPlaying}
              albumArt={fullAlbumArt}
              seek={seek}
              duration={duration}
            />
          </div>
        </div>

        {/* CONTROLS SECTION */}
        <div className="home-panel area-controls text-white">
          <div
            className="d-flex flex-column align-items-center justify-content-center w-100"
            style={{ maxWidth: '450px' }}
          >
            <TrackInfo title={title} artist={artist} album={album} />

            <StreamInfo
              trackType={trackType}
              samplerate={samplerate}
              bitdepth={bitdepth}
              bitrate={bitrate}
              service={service}
            />

            <div className="w-100 my-1 my-md-3 my-lg-4">
              <PlayerSeekbar seek={seek} duration={duration} onSeek={seekTo} />
            </div>

            <PlayerControls
              isPlaying={isPlaying}
              onPlayPause={togglePlay}
              onNext={next}
              onPrev={prev}
              shuffle={random}
              repeat={repeat}
              onShuffle={toggleRandom}
              onRepeat={toggleRepeat}
              onAddToPlaylist={() => {
                /* TODO: implement add to playlist */
              }}
              onShowPlaylist={() => setShowPlaylist(true)}
              isFavourite={isFavourite}
              onToggleFavourite={toggleFavourite}
            />

            {!disableVolumeControl && (
              <div className="mt-1 mt-md-3 mt-lg-5 w-100 px-2 px-lg-4">
                <VolumeManager
                  volume={volume}
                  mute={mute}
                  onVolumeChange={setVolume}
                  onMute={toggleMute}
                />
              </div>
            )}
          </div>
        </div>

        {/* VISUALIZATION SECTION */}
        <div className="spectrum-panel area-spectrum">
          <SpectrumAnalyzer streamUrl={SPECTRUM_STREAM_URL} />
        </div>
      </div>

      {/* Playlist Slide Panel */}
      <Playlist
        open={showPlaylist}
        onClose={() => setShowPlaylist(false)}
        queue={queue}
        currentPosition={position}
        isPlaying={isPlaying}
        onPlay={playFromQueue}
        onRemove={removeFromQueue}
        host={VOLUMIO_BASE_URL}
      />
    </div>
  );
};

export default Home;
