import React, { useMemo } from 'react';
import useVolumioStatus from '@/hooks/useVolumioStatus';
import VinylPlayer from '@/components/animated-players/VinylPlayer';
import PlayerControls from '@/components/PlayerControls';
import TrackInfo from '@/components/TrackInfo';
import PlayerSeekbar from '@/components/PlayerSeekbar';
import VolumeManager from '@/components/VolumeManager';

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
  } = useVolumioStatus();

  // Construct full album art URL
  const host = 'http://192.168.0.132:3000';
  const fullAlbumArt = useMemo(() => {
    if (!albumart) return '';
    if (albumart.startsWith('http')) return albumart;
    return `${host}${albumart}`;
  }, [albumart]);

  if (!isConnected) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center text-white bg-dark">
        <div className="spinner-border text-primary me-3" role="status"></div>
        <span>Connecting to Volumio...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid d-flex flex-column flex-grow-1 h-100 bg-dark overflow-hidden position-relative p-0 start-0 top-0 w-100">
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

      <div
        className="row flex-grow-1 align-items-center justify-content-center position-relative m-0"
        style={{ zIndex: 1 }}
      >
        {/* Left Side: Vinyl Player */}
        <div className="col-12 col-md-5 offset-md-1 d-flex justify-content-center align-items-center h-100">
          <div style={{ transform: 'scale(1.1)' }}>
            <VinylPlayer isPlaying={isPlaying} albumArt={fullAlbumArt} />
          </div>
        </div>

        {/* Right Side: Controls */}
        <div className="col-12 col-md-5 px-4 px-lg-5 text-white h-100 d-flex align-items-center justify-content-center">
          <div
            className="d-flex flex-column align-items-center justify-content-center w-100"
            style={{ maxWidth: '450px' }}
          >
            <TrackInfo title={title} artist={artist} album={album} />

            <div className="w-100 my-4">
              <PlayerSeekbar seek={seek} duration={duration} onSeek={seekTo} />
            </div>

            <PlayerControls
              isPlaying={isPlaying}
              onPlayPause={togglePlay}
              onNext={next}
              onPrev={prev}
            />

            <div className="mt-5 w-100 px-4">
              <VolumeManager
                volume={volume}
                mute={mute}
                onVolumeChange={setVolume}
                onMute={toggleMute}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
