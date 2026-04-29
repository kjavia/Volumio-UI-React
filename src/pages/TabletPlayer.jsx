import { useMemo, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import useVolumioStatus from '@/hooks/useVolumioStatus';
import usePluginConfig from '@/hooks/usePluginConfig';
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
import StreamInfo from '@/components/StreamInfo';
import ServiceLogo from '@/components/ServiceLogo';
import Playlist from '@/components/Playlist';
import DisconnectedScreen from '@/components/DisconnectedScreen';
import AddToPlaylistDialog from '@/components/AddToPlaylistDialog';
import BrowseDialog from '@/components/BrowseDialog';
import PeppyMeter from '@/components/PeppyMeter';
import './tablet-player.scss';

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
  VinylPlayer, VinylCoverPlayer, CdPlayer, CdCoverPlayer,
  CassettePlayer, ReelToReelPlayer, RadioPlayer, GlobePlayer, AlbumArtPlayer,
];

const getPlayerTypeForSource = (service, trackType) => {
  const s = (service || '').toLowerCase();
  const t = (trackType || '').toLowerCase();
  if (s === 'radio' || s.includes('webradio') || s.includes('internet')) return 'radio';
  if (s.includes('qobuz') || s.includes('tidal') || s.includes('deezer') || s.includes('spotify')) return 'globe';
  if (['mp3', 'flac', 'ogg', 'dsd'].includes(t)) return 'cdCover';
  if (s.includes('mp3') || s.includes('flac') || s.includes('ogg') || s.includes('dsd')) return 'cdCover';
  return 'vinylCover';
};

/**
 * TabletPlayer — layout for small desktops (<1920px) and tablets (landscape).
 *
 * Grid:
 *   ┌──────────┬──────────────┐
 *   │  Player  │  Track Info  │
 *   │          │  Controls    │
 *   ├──────────┴──────────────┤
 *   │     Visualization       │
 *   └────────────────────────-┘
 */
const TabletPlayer = ({ vizStopped = false, onVizResumed, vizContainerRef }) => {
  const { data: pluginConfig } = usePluginConfig();
  const playerType = pluginConfig?.playerType || 'radio';
  const showPlayerControls = pluginConfig?.showPlayerControls !== false;
  const albumArtMaxSpace = pluginConfig?.albumArtMaxSpace === true;
  const showTrackPanel = pluginConfig?.showTrackPanel === true;
  const vizType = pluginConfig?.vizType || 'spectrum';
  const showViz = vizType !== 'none';
  const backgroundColor = pluginConfig?.backgroundColor || '';
  const peppyMeterFolder = pluginConfig?.peppyMeterFolder || '';
  const peppyMeterModel = pluginConfig?.peppyMeterModel || 'random';
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

  const { refreshState } = useSeek();
  useEffect(() => { refreshState(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Player cycling
  const [cycleIndex, setCycleIndex] = useState(null);
  const [randomIndex, setRandomIndex] = useState(() =>
    Math.floor(Math.random() * RANDOM_PLAYERS.length)
  );

  useEffect(() => {
    if (playerType === 'random') {
      setRandomIndex(Math.floor(Math.random() * RANDOM_PLAYERS.length));
    }
  }, [title, playerType]);

  useEffect(() => { setCycleIndex(null); }, [playerType]);

  const cyclePlayer = () => {
    setCycleIndex((prev) => {
      const current = prev !== null ? prev : RANDOM_PLAYERS.indexOf(PLAYER_MAP[playerType]);
      return (current + 1) % RANDOM_PLAYERS.length;
    });
  };

  const lastTapRef = useRef(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) { cyclePlayer(); lastTapRef.current = 0; }
    else { lastTapRef.current = now; }
  };

  const vizRef = useRef(null);
  const peppyVizRef = useRef(null);

  const handlePlayPause = () => {
    vizRef.current?.enable();
    togglePlay();
  };

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);

  const fullAlbumArt = useMemo(() => {
    if (!albumart) return '';
    if (albumart.startsWith('http')) return albumart;
    return `${VOLUMIO_BASE_URL}${albumart}`;
  }, [albumart]);

  const effectivePlayerType = playerType === 'matchSource'
    ? getPlayerTypeForSource(service, trackType)
    : playerType;

  const CurrentPlayerComponent =
    cycleIndex !== null
      ? RANDOM_PLAYERS[cycleIndex]
      : effectivePlayerType === 'random'
        ? RANDOM_PLAYERS[randomIndex]
        : PLAYER_MAP[effectivePlayerType] || AlbumArtPlayer;

  const isMaxSpace = albumArtMaxSpace && effectivePlayerType === 'albumArt';

  const [isRetrying, setIsRetrying] = useState(true);
  useEffect(() => {
    if (isConnected) { setIsRetrying(true); return; }
    const timer = setTimeout(() => setIsRetrying(false), 5 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [isConnected]);

  if (!isConnected) {
    return <DisconnectedScreen isRetrying={isRetrying} host={VOLUMIO_BASE_URL} />;
  }

  const gridClasses = [
    'tp-grid',
    !showViz && 'tp-no-viz',
    isMaxSpace && 'tp-max-space',
    effectivePlayerType === 'none' && 'tp-no-player',
  ].filter(Boolean).join(' ');

  return (
    <div className="h-100 overflow-hidden position-relative p-0 w-100">
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

      <div className={gridClasses} style={{ zIndex: 1 }}>

        {/* LEFT — Player */}
        {effectivePlayerType !== 'none' && (
          <div className="tp-player">
            <div
              className="player-responsive"
              onDoubleClick={cyclePlayer}
              onTouchEnd={handleDoubleTap}
            >
              <CurrentPlayerComponent
                isPlaying={isPlaying}
                albumArt={fullAlbumArt}
                maxSpace={isMaxSpace}
              />
            </div>
          </div>
        )}

        {/* RIGHT — Track Info + Controls */}
        <div className="tp-right">
          <div className="tp-track-info text-white">
            <div className={`track-info-group ${showTrackPanel ? 'track-panel' : ''}`} style={{ width: 'clamp(300px, 95%, 99%)' }}>
              <TrackInfo title={title} artist={artist} album={album}>
                <div className="stream-info-row d-flex align-items-center justify-content-center gap-3">
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

          <div className="tp-controls text-white">
            <div className="d-flex flex-column align-items-center justify-content-center w-100 player-controls-container">
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

        {/* BOTTOM — Visualization */}
        {showViz && (
          <div className="tp-viz" ref={vizContainerRef || peppyVizRef}>
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
            {vizType === 'peppyMeter' && <PeppyMeter folder={peppyMeterFolder} model={peppyMeterModel} trackUri={streamUri} />}
          </div>
        )}
      </div>

      {/* Dialogs */}
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
      <BrowseDialog open={showBrowse} onClose={() => setShowBrowse(false)} />
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

TabletPlayer.propTypes = {
  vizStopped: PropTypes.bool,
  onVizResumed: PropTypes.func,
  vizContainerRef: PropTypes.object,
};

export default TabletPlayer;
