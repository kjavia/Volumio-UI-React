import { useMemo, useState, useRef, useEffect } from 'react';
import useVolumioStatus from '@/hooks/useVolumioStatus';
import usePluginConfig from '@/hooks/usePluginConfig';
import usePlayerKeyboard from '@/hooks/usePlayerKeyboard';
import { VOLUMIO_BASE_URL, SPECTRUM_STREAM_URL } from '@/config';
import { useSeek } from '@/contexts/SeekContext';
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
import mobileSpectrumOptions from '@/config/mobileSpectrumOptions';
import StreamInfo from '@/components/StreamInfo';
import ServiceLogo from '@/components/ServiceLogo';
import Playlist from '@/components/Playlist';
import DisconnectedScreen from '@/components/DisconnectedScreen';
import AddToPlaylistDialog from '@/components/AddToPlaylistDialog';
import BrowseDialog from '@/components/BrowseDialog';
import PeppyMeter from '@/components/PeppyMeter';
import PeppySpectrum from '@/components/peppy-spectrum/PeppySpectrum';

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

  if (['mp3', 'flac', 'ogg', 'dsd'].includes(t)) {
    return 'cdCover';
  }

  // Service might also identify formats directly
  if (s.includes('mp3') || s.includes('flac') || s.includes('ogg') || s.includes('dsd')) {
    return 'cdCover';
  }

  return 'vinylCover';
};

const Player = ({ vizStopped = false, onVizResumed, vizContainerRef }) => {
  useEffect(() => { document.title = 'Volumio - Stylish Player | Player'; }, []);
  const { data: pluginConfig } = usePluginConfig();
  const playerType = pluginConfig?.playerType || 'radio';
  const showPlayerControls = pluginConfig?.showPlayerControls !== false;
  const albumArtMaxSpace = pluginConfig?.albumArtMaxSpace === true;
  const albumArtAnimated = pluginConfig?.albumArtAnimated !== false;
  const showTrackPanel = pluginConfig?.showTrackPanel === true;
  const vizType = pluginConfig?.vizType || 'spectrum';
  const showViz = vizType !== 'none';
  const backgroundColor = pluginConfig?.backgroundColor || '';
  const peppyMeterFolder = pluginConfig?.peppyMeterFolder || '';
  const peppyMeterModel = pluginConfig?.peppyMeterModel || 'random';
  const peppySpectrumFolder = pluginConfig?.peppySpectrumFolder || '';
  const peppySpectrumModel = pluginConfig?.peppySpectrumModel || 'random';

  const spectrumOptions = useMemo(() => {
    const raw = pluginConfig?.spectrumOptions;
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }, [pluginConfig?.spectrumOptions]);

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
    disableVolumeControl: volumioDisableVolume,
    samplerate,
    bitdepth,
    trackType,
    codec,
    bitrate,
    service,
    position,
    queue,
    removeFromQueue,
    clearQueue,
    playFromQueue,
    isFavourite,
    toggleFavourite,
    streamUri,
  } = useVolumioStatus();

  const disableVolumeControl = volumioDisableVolume || pluginConfig?.disableVolumeControl === true;

  const [cycleIndex, setCycleIndex] = useState(null);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);

  usePlayerKeyboard({
    onPlayPause: togglePlay,
    onPrev: prev,
    onNext: next,
    onQueue: () => setShowPlaylist((prev) => !prev),
    onBrowse: () => setShowBrowse(true),
    onAddToPlaylist: () => setShowAddToPlaylist(true),
    onFavourite: toggleFavourite,
    onRepeat: toggleRepeat,
    onShuffle: toggleRandom,
  });

  const vizRef = useRef(null);
  const mobileVizRef = useRef(null);
  const peppyMobileRef = useRef(null);

  // Wrap togglePlay so that clicking play/pause (a user gesture) also enables
  // the visualization if it hasn't been enabled yet.
  const handlePlayPause = () => {
    vizRef.current?.enable();
    mobileVizRef.current?.enable();
    togglePlay();
  };

  const { refreshState } = useSeek();

  // Refresh Volumio state on mount so seek is accurate after navigating away
  useEffect(() => {
    refreshState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pick a random player index on mount or when a new track starts
  const [randomIndex, setRandomIndex] = useState(() =>
    Math.floor(Math.random() * RANDOM_PLAYERS.length)
  );
  useEffect(() => {
    if (playerType === 'random' && title) {
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

  const lastTapRef = useRef(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) { cyclePlayer(); lastTapRef.current = 0; }
    else { lastTapRef.current = now; }
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
    <div className="container-fluid h-100 bg-dark overflow-hidden position-relative p-0 w-100">
      {/* Background */}
      {backgroundColor ? (
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ backgroundColor, zIndex: 0 }}
        />
      ) : fullAlbumArt ? (
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
      ) : null}

      <div className={`home-grid position-relative ${!showViz ? 'no-viz' : ''} ${albumArtMaxSpace && effectivePlayerType === 'albumArt' ? 'album-art-max-space' : ''} ${effectivePlayerType === 'none' ? 'no-player' : ''}`} style={{ zIndex: 1 }}>
        {/* PLAYER SECTION */}
        {effectivePlayerType !== 'none' && (
          <div className="home-panel area-player">
            <div
              className="player-responsive"
              onDoubleClick={cyclePlayer}
              onTouchEnd={handleDoubleTap}
            >
              <CurrentPlayerComponent isPlaying={isPlaying} albumArt={fullAlbumArt} maxSpace={albumArtMaxSpace && effectivePlayerType === 'albumArt'} animated={albumArtAnimated && effectivePlayerType === 'albumArt'} />
            </div>
          </div>
        )}

        {/* MOBILE VISUALIZER — between player and controls on mobile only */}
        {showViz && vizType === 'spectrum' && (
          <div className="home-panel area-mobile-viz">
            {!isPlaying && <span className="material-icons viz-placeholder">equalizer</span>}
            <SpectrumAnalyzer
              ref={mobileVizRef}
              stopped={vizStopped}
              onResumed={onVizResumed}
              streamUrl={SPECTRUM_STREAM_URL}
              options={mobileSpectrumOptions}
              isPlaying={isPlaying}
            />
          </div>
        )}
        {showViz && vizType === 'peppyMeter' && (
          <div className="home-panel area-mobile-viz" ref={peppyMobileRef}>
            {!isPlaying && <span className="material-icons viz-placeholder">equalizer</span>}
            <PeppyMeter folder={peppyMeterFolder} model={peppyMeterModel} trackUri={streamUri} stopped={!isPlaying} />
          </div>
        )}
        {showViz && vizType === 'peppySpectrum' && (
          <div className="home-panel area-mobile-viz" ref={peppyMobileRef}>
            {!isPlaying && <span className="material-icons viz-placeholder">equalizer</span>}
            <PeppySpectrum folder={peppySpectrumFolder} model={peppySpectrumModel} trackUri={streamUri} stopped={!isPlaying} />
          </div>
        )}

        {/* RIGHT COLUMN — dissolves on mobile so track-info gets its own grid row */}
        <div className="right-column">
          {/* TRACK INFO — own grid row on mobile, stacked above controls on desktop */}
          <div className="area-track-info text-white">
            <div className={`track-info-group ${showTrackPanel ? 'track-panel' : ''}`} style={{ width: 'clamp(300px, 95%, 99%)' }}>
              <TrackInfo title={title} artist={artist} album={album}>
                <div className="stream-info-row d-flex align-items-center justify-content-center gap-3 w-100">
                  <ServiceLogo service={service} />
                  <StreamInfo
                    trackType={trackType}
                    codec={codec}
                    samplerate={samplerate}
                    bitdepth={bitdepth}
                    bitrate={bitrate}
                  />
                </div>
              </TrackInfo>
            </div>
          </div>

          {/* CONTROLS SECTION */}
          <div className="home-panel area-controls text-white">
            <div
              className="d-flex flex-column align-items-center justify-content-center w-100 player-controls-container">
              {/* Spacer — pushes seekbar/controls down */}
              <div className="controls-spacer" />

              <div className="m-auto seekbar-container-wrap px-3" style={{ width: 'clamp(300px, 500px, 90%)' }}>
                <PlayerSeekbar readOnly={!showPlayerControls} />
              </div>

              {showPlayerControls && (
                <PlayerControls
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  onNext={next}
                  onPrev={prev}
                  shuffle={random}
                  repeat={repeat}
                  onShuffle={toggleRandom}
                  onRepeat={toggleRepeat}
                  onAddToPlaylist={() => setShowAddToPlaylist(true)}
                  onShowPlaylist={() => setShowPlaylist(true)}
                  onBrowse={() => setShowBrowse(true)}
                  isFavourite={isFavourite}
                  onToggleFavourite={toggleFavourite}
                />
              )}

              {!disableVolumeControl && showPlayerControls && (
                <div className="volume-manager-wrap px-3" style={{ width: 'clamp(300px, 500px, 90%)' }}>
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
        </div>

        {/* VISUALIZATION SECTION */}
        {showViz && (
          <div className="spectrum-panel area-spectrum" ref={vizContainerRef}>
            {!isPlaying && <span className="material-icons viz-placeholder">equalizer</span>}
            {vizType === 'spectrum' && (
              <SpectrumAnalyzer
                ref={vizRef}
                stopped={vizStopped}
                onResumed={onVizResumed}
                streamUrl={SPECTRUM_STREAM_URL}
                options={spectrumOptions}
                isPlaying={isPlaying}
              />
            )}
            {vizType === 'peppyMeter' && (
              <PeppyMeter folder={peppyMeterFolder} model={peppyMeterModel} trackUri={streamUri} stopped={!isPlaying} />
            )}
            {vizType === 'peppySpectrum' && (
              <PeppySpectrum folder={peppySpectrumFolder} model={peppySpectrumModel} trackUri={streamUri} stopped={!isPlaying} />
            )}
          </div>
        )}
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
        onClear={clearQueue}
        host={VOLUMIO_BASE_URL}
      />

      {/* Browse Dialog */}
      <BrowseDialog
        open={showBrowse}
        onClose={() => setShowBrowse(false)}
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
  );
};

export default Player;
