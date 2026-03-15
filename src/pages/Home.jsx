import React, { useMemo, useState, useRef } from 'react';
import useVolumioStatus from '@/hooks/useVolumioStatus';
import VinylPlayer from '@/components/animated-players/VinylPlayer';
import VinylCoverPlayer from '@/components/animated-players/VinylCoverPlayer';
import CdPlayer from '@/components/animated-players/CdPlayer';
import CdCoverPlayer from '@/components/animated-players/CdCoverPlayer';
import CassettePlayer from '@/components/animated-players/CassettePlayer';
import ReelToReelPlayer from '@/components/animated-players/ReelToReelPlayer';
import PlayerControls from '@/components/PlayerControls';
import TrackInfo from '@/components/TrackInfo';
import PlayerSeekbar from '@/components/PlayerSeekbar';
import VolumeManager from '@/components/VolumeManager';
import SpectrumAnalyzer from '@/components/spectrum-analyzers/SpectrumAnalyzer';
import DisconnectedScreen from '@/components/DisconnectedScreen';

const PLAYERS = [
  VinylPlayer,
  VinylCoverPlayer,
  CdPlayer,
  CdCoverPlayer,
  CassettePlayer,
  ReelToReelPlayer,
];

const Home = () => {
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
  } = useVolumioStatus();

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const touchTimer = useRef(null);

  const cyclePlayer = () => {
    setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % PLAYERS.length);
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

  const CurrentPlayerComponent = PLAYERS[currentPlayerIndex];

  // Construct full album art URL
  const host = 'http://192.168.0.132';
  const fullAlbumArt = useMemo(() => {
    if (!albumart) return '';
    if (albumart.startsWith('http')) return albumart;
    return `${host}${albumart}`;
  }, [albumart]);

  if (!isConnected) {
    return <DisconnectedScreen isRetrying host={host} />;
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
          <SpectrumAnalyzer streamUrl={`${host}:8000`} />
        </div>
      </div>
    </div>
  );
};

export default Home;
