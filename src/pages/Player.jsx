import { useMemo, useState, useRef, useEffect } from 'react';
import useVolumioStatus from '@/hooks/useVolumioStatus';
import usePluginConfig from '@/hooks/usePluginConfig';
import { VOLUMIO_BASE_URL, SPECTRUM_STREAM_URL } from '@/config';
import { SeekProvider } from '@/contexts/SeekContext';
import AlbumArtPlayer from '@/components/animated-players/AlbumArtPlayer';
import VinylPlayer from '@/components/animated-players/VinylPlayer';
import VinylCoverPlayer from '@/components/animated-players/VinylCoverPlayer';
import CdPlayer from '@/components/animated-players/CdPlayer';
import CdCoverPlayer from '@/components/animated-players/CdCoverPlayer';
import CassettePlayer from '@/components/animated-players/CassettePlayer';
import ReelToReelPlayer from '@/components/animated-players/ReelToReelPlayer';
import RadioPlayer from '@/components/animated-players/RadioPlayer';
import GlobePlayer from '@/components/animated-players/GlobePlayer';
import PlayerControls from '@/components/PlayerControls';
import TrackInfo from '@/components/TrackInfo';
import PlayerSeekbar from '@/components/PlayerSeekbar';
import VolumeManager from '@/components/VolumeManager';
import SpectrumAnalyzer from '@/components/spectrum-analyzers/SpectrumAnalyzer';
import StreamInfo from '@/components/StreamInfo';
import Playlist from '@/components/Playlist';
import DisconnectedScreen from '@/components/DisconnectedScreen';
import AddToPlaylistDialog from '@/components/AddToPlaylistDialog';
import VUMeter from '@/components/vu-meters/VUMeter';

const PLAYER_MAP = {
  albumArt: AlbumArtPlayer,
  vinyl: VinylPlayer,
  vinylCover: VinylCoverPlayer,
  cd: CdPlayer,
  cdCover: CdCoverPlayer,
  cassette: CassettePlayer,
  reelToReel: ReelToReelPlayer,
  radio: RadioPlayer,
  globe: GlobePlayer,
};

const RANDOM_PLAYERS = [
  VinylPlayer,
  VinylCoverPlayer,
  CdPlayer,
  CdCoverPlayer,
  CassettePlayer,
  ReelToReelPlayer,
  RadioPlayer,
  GlobePlayer,
  AlbumArtPlayer,
];

const getPlayerTypeForSource = (service, trackType) => {
  const s = (service || '').toLowerCase();
  const t = (trackType || '').toLowerCase();

  if (s === 'radio' || s.includes('webradio') || s.includes('internet')) {
    return 'radio';
  }

  if (s.includes('qobuz') || s.includes('tidal') || s.includes('deezer') || s.includes('spotify')) {
    return 'globe';
  }

  if (['mp3', 'flac', 'dsd'].includes(t)) {
    return 'cdCover';
  }

  // Service might also identify formats directly
  if (s.includes('mp3') || s.includes('flac') || s.includes('dsd')) {
    return 'cdCover';
  }

  return 'vinylCover';
};

const Player = () => {
  const { data: pluginConfig } = usePluginConfig();
  const playerType = pluginConfig?.playerType || 'radio';
  const showPlayerControls = pluginConfig?.showPlayerControls !== false;
  const vizType = pluginConfig?.vizType || 'spectrum';

  const {
    isConnected,
    isPlaying,
    title,
    artist,
    album,
    albumart,
    volume,
    mute,
    togglePlay,
    next,
    prev,
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
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const touchTimer = useRef(null);

  // Pick a random player index on mount or when a new track starts
  const [randomIndex, setRandomIndex] = useState(() =>
    Math.floor(Math.random() * RANDOM_PLAYERS.length)
  );
  useEffect(() => {
    if (playerType === 'random') {
      setRandomIndex(Math.floor(Math.random() * RANDOM_PLAYERS.length));
    }
  }, [title, playerType]);

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
    }, 800);
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
    }
  };

  const effectivePlayerType =
    playerType === 'matchSource' ? getPlayerTypeForSource(service, trackType) : playerType;

  const CurrentPlayerComponent =
    cycleIndex !== null
      ? RANDOM_PLAYERS[cycleIndex]
      : effectivePlayerType === 'random'
        ? RANDOM_PLAYERS[randomIndex]
        : PLAYER_MAP[effectivePlayerType] || AlbumArtPlayer;

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
    <SeekProvider>
      <div className="container-fluid h-100 bg-dark overflow-hidden position-relative p-0 w-100">
        {/* Background Blur */}
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
              <CurrentPlayerComponent isPlaying={isPlaying} albumArt={fullAlbumArt} />
            </div>
          </div>

          {/* CONTROLS SECTION */}
          <div className="home-panel area-controls text-white">
            <div
              className="d-flex flex-column align-items-center justify-content-center w-100 h-100 player-controls-container"
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
                <PlayerSeekbar readOnly={!showPlayerControls} />
              </div>

              {showPlayerControls && (
                <PlayerControls
                  isPlaying={isPlaying}
                  onPlayPause={togglePlay}
                  onNext={next}
                  onPrev={prev}
                  shuffle={random}
                  repeat={repeat}
                  onShuffle={toggleRandom}
                  onRepeat={toggleRepeat}
                  onAddToPlaylist={() => setShowAddToPlaylist(true)}
                  onShowPlaylist={() => setShowPlaylist(true)}
                  isFavourite={isFavourite}
                  onToggleFavourite={toggleFavourite}
                />
              )}

              {!disableVolumeControl && showPlayerControls && (
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
            {vizType === 'spectrum' && <SpectrumAnalyzer streamUrl={SPECTRUM_STREAM_URL} />}
            {vizType === 'vuMeter1' && <VUMeter variant={1} streamUrl={SPECTRUM_STREAM_URL} />}
            {vizType === 'vuMeter2' && <VUMeter variant={2} streamUrl={SPECTRUM_STREAM_URL} />}
            {vizType === 'vuMeter3' && <VUMeter variant={3} streamUrl={SPECTRUM_STREAM_URL} />}
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

        {/* Add to Playlist Dialog */}
        <AddToPlaylistDialog
          open={showAddToPlaylist}
          onClose={() => setShowAddToPlaylist(false)}
          track={{
            title,
            artist,
            album,
            albumart,
            uri: queue[position]?.uri,
            service,
          }}
        />
      </div>
    </SeekProvider>
  );
};

export default Player;
