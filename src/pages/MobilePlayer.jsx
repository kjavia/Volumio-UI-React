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
import TrackInfo from '@/components/TrackInfo';
import PlayerSeekbar from '@/components/PlayerSeekbar';
import VolumeManager from '@/components/VolumeManager';
import Button from '@/components/Button';
import SpectrumAnalyzer from '@/components/spectrum-analyzers/SpectrumAnalyzer';
import mobileSpectrumOptions from '@/config/mobileSpectrumOptions';
import StreamInfo from '@/components/StreamInfo';
import ServiceLogo from '@/components/ServiceLogo';
import Playlist from '@/components/Playlist';
import DisconnectedScreen from '@/components/DisconnectedScreen';
import AddToPlaylistDialog from '@/components/AddToPlaylistDialog';
import BrowseDialog from '@/components/BrowseDialog';
import PeppyMeter from '@/components/PeppyMeter';
import './mobile-player.scss';

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
 * MobilePlayer — optimised layout for screens ≤ 768 px wide.
 *
 * Layout (single column, top to bottom):
 *   Row 1 (30%) — Player (album art fills space without touching edges)
 *   Row 2 (10%) — Visualizations
 *   Row 3 (20%) — Track info
 *   Row 4 (40%) — Controls: seekbar / transport buttons / volume
 */
const MobilePlayer = ({ vizStopped = false, onVizResumed }) => {
  const { data: pluginConfig } = usePluginConfig();
  const playerType = pluginConfig?.playerType || 'radio';
  const showPlayerControls = pluginConfig?.showPlayerControls !== false;
  const showTrackPanel = pluginConfig?.showTrackPanel === true;
  const vizType = pluginConfig?.vizType || 'spectrum';
  const showViz = vizType !== 'none';
  const backgroundColor = pluginConfig?.backgroundColor || '';
  const peppyMeterFolder = pluginConfig?.peppyMeterFolder || '';
  const peppyMeterModel = pluginConfig?.peppyMeterModel || 'random';
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

  const { seek, duration, refreshState } = useSeek();
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

  const mobileVizRef = useRef(null);
  const peppyMobileRef = useRef(null);

  const handlePlayPause = () => {
    mobileVizRef.current?.enable();
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

  // Track info for PeppyMeter playinfo overlays
  const peppyTrackInfo = useMemo(() => {
    const remaining = duration > 0 ? Math.max(0, duration - seek / 1000) : 0;
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    return {
      title: title || '',
      artist: artist || '',
      album: album || '',
      albumart: fullAlbumArt,
      samplerate: samplerate || '',
      remaining: duration > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : '',
    };
  }, [title, artist, album, fullAlbumArt, samplerate, duration, seek]);

  const effectivePlayerType = playerType === 'matchSource'
    ? getPlayerTypeForSource(service, trackType)
    : playerType;

  const CurrentPlayerComponent =
    cycleIndex !== null
      ? RANDOM_PLAYERS[cycleIndex]
      : effectivePlayerType === 'random'
        ? RANDOM_PLAYERS[randomIndex]
        : PLAYER_MAP[effectivePlayerType] || AlbumArtPlayer;

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
    'mobile-grid',
    'position-relative',
    !showViz && 'no-viz',
    effectivePlayerType === 'none' && 'no-player',
    (disableVolumeControl || !showPlayerControls) && 'no-volume',
  ].filter(Boolean).join(' ');

  return (
    <div
      className="container-fluid h-100 bg-dark overflow-hidden position-relative p-0 w-100"
    >
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

      {/* ── Mobile Grid ── */}
      <div className={gridClasses} style={{ zIndex: 1 }}>

        {/* ROW 1 — Player (30%) */}
        {effectivePlayerType !== 'none' && (
          <div className="mobile-row-player">
            <div
              className="player-responsive"
              onDoubleClick={cyclePlayer}
              onTouchEnd={handleDoubleTap}
            >
              <CurrentPlayerComponent
                isPlaying={isPlaying}
                albumArt={fullAlbumArt}
              />
            </div>
          </div>
        )}

        {/* ROW 2 — Visualizations (10%) */}
        {showViz && vizType === 'spectrum' && (
          <div className="mobile-row-viz">
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
          <div className="mobile-row-viz" ref={peppyMobileRef}>
            {!isPlaying && <span className="material-icons viz-placeholder">equalizer</span>}
            <PeppyMeter
              folder={peppyMeterFolder}
              model={peppyMeterModel}
              trackUri={streamUri}
              trackInfo={peppyTrackInfo}
            />
          </div>
        )}

        {/* ROW 3 — Track Info (20%) */}
        <div className="mobile-row-track-info text-white">
          <div
            className={`track-info-group ${showTrackPanel ? 'track-panel' : ''}`}
            style={{ width: 'clamp(200px, 95%, 99%)' }}
          >
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

        {/* ROW 4 — Seekbar */}
        <div className="mobile-row-seekbar text-white">
          <PlayerSeekbar readOnly={!showPlayerControls} />
        </div>

        {/* ROW 5 — Transport buttons */}
        {showPlayerControls && (
          <div className="mobile-row-transport text-white">
            <div className="controls-transport-row d-flex gap-3 align-items-center justify-content-center">
              <Button classNames="btn-round btn-sm" onClick={prev} label="Previous">
                <span className="material-icons">skip_previous</span>
              </Button>
              <Button classNames="btn-round btn-primary" onClick={handlePlayPause} label={isPlaying ? 'Pause' : 'Play'}>
                <span className={`material-icons play-icon ${isPlaying ? 'is-pause' : 'is-play'}`}>{isPlaying ? 'pause' : 'play_arrow'}</span>
              </Button>
              <Button classNames="btn-round btn-sm" onClick={next} label="Next">
                <span className="material-icons">skip_next</span>
              </Button>
            </div>
          </div>
        )}

        {/* ROW 6 — Secondary controls */}
        {showPlayerControls && (
          <div className="mobile-row-secondary text-white">
            <div className="d-flex gap-3 align-items-center justify-content-center">
              <Button classNames={`btn-icon ${random ? 'active' : ''}`} onClick={toggleRandom} label={random ? 'Shuffle On' : 'Shuffle Off'}>
                <span className="material-icons">shuffle</span>
              </Button>
              <Button classNames={`btn-icon ${repeat ? 'active' : ''}`} onClick={toggleRepeat} label={repeat ? 'Repeat On' : 'Repeat Off'}>
                <span className="material-icons">repeat</span>
              </Button>
              <Button classNames="btn-icon" onClick={() => setShowAddToPlaylist(true)} label="Add to Playlist">
                <span className="material-icons">playlist_add</span>
              </Button>
              <Button classNames={`btn-icon ${isFavourite ? 'active' : ''}`} onClick={toggleFavourite} label={isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}>
                <span className="material-icons">{isFavourite ? 'favorite' : 'favorite_border'}</span>
              </Button>
              <Button classNames="btn-icon btn-text" onClick={() => setShowPlaylist(true)} label="Show Playlist">
                <span className="material-icons">queue_music</span>
              </Button>
              <Button classNames="btn-icon btn-text" onClick={() => setShowBrowse(true)} label="Browse">
                <span className="material-icons">library_music</span>
              </Button>
            </div>
          </div>
        )}

        {/* ROW 7 — Volume */}
        {!disableVolumeControl && showPlayerControls && (
          <div className="mobile-row-volume text-white">
            <VolumeManager
              volume={volume}
              mute={mute}
              onVolumeChange={setVolume}
              onMute={toggleMute}
            />
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

MobilePlayer.propTypes = {
  vizStopped: PropTypes.bool,
  onVizResumed: PropTypes.func,
};

export default MobilePlayer;
