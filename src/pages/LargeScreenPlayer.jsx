import { useMemo, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import useVolumioStatus from '@/hooks/useVolumioStatus';
import usePluginConfig from '@/hooks/usePluginConfig';
import useMediaQuery from '@/hooks/useMediaQuery';
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
import PlayerSeekbar from '@/components/PlayerSeekbar';
import SpectrumAnalyzer from '@/components/spectrum-analyzers/SpectrumAnalyzer';
import VUMeter from '@/components/vu-meters/VUMeter';
import Playlist from '@/components/Playlist';
import AddToPlaylistDialog from '@/components/AddToPlaylistDialog';
import BrowseDialog from '@/components/BrowseDialog';
import DisconnectedScreen from '@/components/DisconnectedScreen';
import Button from '@/components/Button';
import Marquee from '@/components/Marquee';
import StreamInfo from '@/components/StreamInfo';
import ServiceLogo from '@/components/ServiceLogo';
import './large-screen-player.scss';

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
  if (['mp3', 'flac', 'dsd'].includes(t)) return 'cdCover';
  if (s.includes('mp3') || s.includes('flac') || s.includes('dsd')) return 'cdCover';
  return 'vinylCover';
};

/** Inline vertical volume popup shown when the volume button is pressed */
const VolumePopup = ({ volume, mute, onVolumeChange, onMute, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const currentVolume = mute ? 0 : (volume || 0);

  return (
    <div ref={ref} className="lsp-volume-popup">
      <div className="lsp-volume-popup__slider-wrap">
        <input
          type="range"
          className="lsp-volume-popup__range"
          min="0"
          max="100"
          value={currentVolume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          orient="vertical"
          aria-label="Volume"
        />
      </div>
      <div className="lsp-volume-popup__value">{currentVolume}</div>
      <Button
        classNames={`btn-icon lsp-volume-popup__mute ${mute ? 'active' : ''}`}
        onClick={onMute}
        label={mute ? 'Unmute' : 'Mute'}
      >
        <span className="material-icons">
          {currentVolume === 0 ? 'volume_off' : currentVolume < 50 ? 'volume_down' : 'volume_up'}
        </span>
      </Button>
    </div>
  );
};

VolumePopup.propTypes = {
  volume: PropTypes.number,
  mute: PropTypes.bool,
  onVolumeChange: PropTypes.func.isRequired,
  onMute: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

/**
 * LargeScreenPlayer — full-screen layout for displays ≥ 1920 px wide.
 *
 * Layout overview:
 *   • Full-screen blurred album-art wallpaper
 *   • Top section: track title + service (row 1), artist + album (row 2)
 *   • Bottom section:
 *       row 1 — animated player widget (left) + visualization (right)
 *       row 2 — seekbar with timestamps
 *       row 3 — three button groups: left edge / centre transport / right edge
 */
const LargeScreenPlayer = ({ vizStopped = false, onVizResumed, menuSlot }) => {
  const { data: pluginConfig } = usePluginConfig();
  const playerType = pluginConfig?.playerType || 'radio';
  const vizType = pluginConfig?.vizType || 'spectrum';
  const showViz = vizType !== 'none';
  const showPlayerControls = pluginConfig?.showPlayerControls !== false;
  const backgroundColor = pluginConfig?.backgroundColor || '';

  // Ultrawide landscape short — 3-column layout (player | meta | viz)
  // Targets screens like 2650×700 or 1920×515 where width >> height
  const isUwls = useMediaQuery('(max-height: 700px) and (min-width: 1440px) and (min-aspect-ratio: 2/1)');

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
    disableVolumeControl,
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
  } = useVolumioStatus();

  const { refreshState } = useSeek();
  useEffect(() => { refreshState(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Player cycling (same logic as Player.jsx)
  const [cycleIndex, setCycleIndex] = useState(null);
  const [randomIndex, setRandomIndex] = useState(() => Math.floor(Math.random() * RANDOM_PLAYERS.length));

  // Derived state: reset cycleIndex when playerType changes
  const [prevPlayerType, setPrevPlayerType] = useState(playerType);
  if (prevPlayerType !== playerType) {
    setPrevPlayerType(playerType);
    setCycleIndex(null);
  }

  // Pick a new random index when title or playerType changes (async setState to satisfy lint rules)
  useEffect(() => {
    if (playerType !== 'random') return;
    const id = setTimeout(() => setRandomIndex(Math.floor(Math.random() * RANDOM_PLAYERS.length)), 0);
    return () => clearTimeout(id);
  }, [title, playerType]);

  const cyclePlayer = () => {
    setCycleIndex((prev) => {
      const current = prev !== null ? prev : RANDOM_PLAYERS.indexOf(PLAYER_MAP[playerType]);
      return (current + 1) % RANDOM_PLAYERS.length;
    });
  };

  const touchTimer = useRef(null);
  const handleTouchStart = () => { touchTimer.current = setTimeout(cyclePlayer, 800); };
  const handleTouchEnd = () => { if (touchTimer.current) clearTimeout(touchTimer.current); };

  const vizRef = useRef(null);

  // Wrap togglePlay so clicking play/pause (a user gesture) also enables the viz.
  const handlePlayPause = () => {
    vizRef.current?.enable();
    togglePlay();
  };

  // Panel state
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showVolumePopup, setShowVolumePopup] = useState(false);

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

  const [isRetrying, setIsRetrying] = useState(true);
  useEffect(() => {
    if (isConnected) {
      const id = setTimeout(() => setIsRetrying(true), 0);
      return () => clearTimeout(id);
    }
    const timer = setTimeout(() => setIsRetrying(false), 5 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [isConnected]);

  if (!isConnected) {
    return <DisconnectedScreen isRetrying={isRetrying} host={VOLUMIO_BASE_URL} />;
  }

  // ── Shared JSX blocks reused in both standard and UWLS layouts ──────────

  const vizBlock = showViz && (
    <div className="lsp-viz-area">
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
      {vizType === 'vuMeter1' && <VUMeter variant={1} needleColor="#0d0d0d" stopped={vizStopped} onResumed={onVizResumed} streamUrl={SPECTRUM_STREAM_URL} />}
      {vizType === 'vuMeter2' && <VUMeter variant={2} needleColor="lightblue" stopped={vizStopped} onResumed={onVizResumed} streamUrl={SPECTRUM_STREAM_URL} />}
      {vizType === 'vuMeter3' && <VUMeter variant={3} needleColor="#0d0d0d" stopped={vizStopped} onResumed={onVizResumed} streamUrl={SPECTRUM_STREAM_URL} />}
      {vizType === 'vuMeter4' && <VUMeter variant={4} needleColor="silver" stopped={vizStopped} onResumed={onVizResumed} streamUrl={SPECTRUM_STREAM_URL} />}
    </div>
  );

  const playerBlock = (
    <div
      className="lsp-player-area"
      onDoubleClick={cyclePlayer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <CurrentPlayerComponent isPlaying={isPlaying} albumArt={fullAlbumArt} />
    </div>
  );

  const metaBlock = (
    <div className="lsp-meta-area">
      <div className="lsp-top">
        {/* Row 1: Title (left) + Service logo (right) */}
        <div className="lsp-top__row1">
          <div className="lsp-top__title">
            <Marquee align="left">{title || 'Unknown Title'}</Marquee>
          </div>
          <ServiceLogo service={service} className="lsp-top__service-logo" />
        </div>

        {/* Row 2: Artist · Album */}
        <div className="lsp-top__row2">
          <span className="lsp-top__artist">
            <Marquee align="left">{artist || 'Unknown Artist'}</Marquee>
          </span>
          {album && (
            <>
              <span className="lsp-top__sep"> · </span>
              <span className="lsp-top__album">
                <Marquee align="left">{album}</Marquee>
              </span>
            </>
          )}
        </div>

        {/* Row 3: Stream info */}
        <div className="lsp-top__row3">
          <StreamInfo
            trackType={/radio|internet/i.test(trackType || service || '') ? null : trackType}
            codec={codec}
            samplerate={samplerate}
            bitdepth={bitdepth}
            bitrate={bitrate}
            className="lsp-stream-info"
          />
        </div>
      </div>
    </div>
  );

  const seekbarBlock = (
    <div className="lsp-seekbar-area">
      <PlayerSeekbar readOnly={!showPlayerControls} />
    </div>
  );

  const controlsBlock = (
    <div className="lsp-controls-area">
      {/* Left edge buttons */}
      <div className="lsp-btn-group lsp-btn-group--left">
        {menuSlot}
        {showPlayerControls && (
          <Button
            classNames={`btn-icon lsp-btn ${isFavourite ? 'active' : ''}`}
            onClick={toggleFavourite}
            label={isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
          >
            <span className="material-icons">{isFavourite ? 'favorite' : 'favorite_border'}</span>
          </Button>
        )}
      </div>

      {/* Centre transport controls */}
      <div className="lsp-btn-group lsp-btn-group--center">
        <Button classNames={`btn-icon lsp-btn lsp-btn--sm ${repeat ? 'active' : ''}`} onClick={toggleRepeat} label={repeat ? 'Repeat On' : 'Repeat Off'}>
          <span className="material-icons">repeat</span>
        </Button>
        <Button classNames="btn-round lsp-btn lsp-btn--md" onClick={prev} label="Previous">
          <span className="material-icons">skip_previous</span>
        </Button>
        <Button classNames="btn-round btn-primary lsp-btn lsp-btn--lg" onClick={handlePlayPause} label={isPlaying ? 'Pause' : 'Play'}>
          <span className="material-icons play-icon">{isPlaying ? 'pause' : 'play_arrow'}</span>
        </Button>
        <Button classNames="btn-round lsp-btn lsp-btn--md" onClick={next} label="Next">
          <span className="material-icons">skip_next</span>
        </Button>
        <Button classNames={`btn-icon lsp-btn lsp-btn--sm ${random ? 'active' : ''}`} onClick={toggleRandom} label={random ? 'Shuffle On' : 'Shuffle Off'}>
          <span className="material-icons">shuffle</span>
        </Button>
      </div>

      {/* Right edge buttons */}
      <div className="lsp-btn-group lsp-btn-group--right">
        <Button classNames="btn-icon lsp-btn" onClick={() => setShowAddToPlaylist(true)} label="Add to Playlist">
          <span className="material-icons">playlist_add</span>
        </Button>
        <Button classNames="btn-icon lsp-btn" onClick={() => setShowPlaylist(true)} label="Current Playlist">
          <span className="material-icons">queue_music</span>
        </Button>
        <Button classNames="btn-icon lsp-btn" onClick={() => setShowBrowse(true)} label="Browse">
          <span className="material-icons">library_music</span>
        </Button>
        {!disableVolumeControl && (
          <div className="lsp-volume-btn-wrap position-relative">
            <Button
              classNames={`btn-icon lsp-btn ${showVolumePopup ? 'active' : ''}`}
              onClick={() => setShowVolumePopup((v) => !v)}
              label="Volume"
            >
              <span className="material-icons">
                {(mute || volume === 0) ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up'}
              </span>
            </Button>
            {showVolumePopup && (
              <VolumePopup
                volume={volume}
                mute={mute}
                onVolumeChange={setVolume}
                onMute={toggleMute}
                onClose={() => setShowVolumePopup(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="lsp-root">
      {/* ── Background wallpaper ── */}
      {backgroundColor ? (
        <div className="lsp-bg" style={{ backgroundColor, filter: 'none', transform: 'none' }} />
      ) : fullAlbumArt ? (
        <div className="lsp-bg" style={{ backgroundImage: `url(${fullAlbumArt})` }} />
      ) : null}

      {/* ── Content ── */}
      {isUwls ? (
        /* ═══ UWLS layout: [player + meta] | viz / seekbar / controls ═══ */
        <div className={`lsp-content lsp-content--uwls${showViz ? '' : ' lsp-content--uwls-noviz'}`}>
          <div className="lsp-left-group">
            {playerBlock}
            {metaBlock}
          </div>
          {vizBlock}
          {seekbarBlock}
          {controlsBlock}
        </div>
      ) : (
        /* ═══ Standard layout: meta top / player+viz / seekbar / controls ═══ */
        <div className="lsp-content">
          {/* ════ TOP SECTION ════ */}
          <div className="lsp-top">
            <div className="lsp-top__row1">
              <div className="lsp-top__title">
                <Marquee align="left">{title || 'Unknown Title'}</Marquee>
              </div>
              <ServiceLogo service={service} className="lsp-top__service-logo" />
            </div>
            <div className="lsp-top__row2">
              <span className="lsp-top__artist">
                <Marquee align="left">{artist || 'Unknown Artist'}</Marquee>
              </span>
              {album && (
                <>
                  <span className="lsp-top__sep"> · </span>
                  <span className="lsp-top__album">
                    <Marquee align="left">{album}</Marquee>
                  </span>
                </>
              )}
            </div>
            <div className="lsp-top__row3">
              <StreamInfo
                trackType={/radio|internet/i.test(trackType || service || '') ? null : trackType}
                codec={codec}
                samplerate={samplerate}
                bitdepth={bitdepth}
                bitrate={bitrate}
                className="lsp-stream-info"
              />
            </div>
          </div>

          {/* ════ BOTTOM SECTION ════ */}
          <div className="lsp-bottom">
            {/* Row 1: Mini player (left) + Visualization (right) */}
            <div className="lsp-bottom__row1">
              <div className="lsp-bottom__player"
                onDoubleClick={cyclePlayer}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
              >
                <CurrentPlayerComponent isPlaying={isPlaying} albumArt={fullAlbumArt} />
              </div>
              {showViz && (
                <div className="lsp-bottom__viz">
                  {vizType === 'spectrum' && (
                    <SpectrumAnalyzer ref={vizRef} stopped={vizStopped} onResumed={onVizResumed} streamUrl={SPECTRUM_STREAM_URL} options={spectrumOptions} isPlaying={isPlaying} />
                  )}
                  {vizType === 'vuMeter1' && <VUMeter variant={1} needleColor="#0d0d0d" stopped={vizStopped} onResumed={onVizResumed} streamUrl={SPECTRUM_STREAM_URL} />}
                  {vizType === 'vuMeter2' && <VUMeter variant={2} needleColor="lightblue" stopped={vizStopped} onResumed={onVizResumed} streamUrl={SPECTRUM_STREAM_URL} />}
                  {vizType === 'vuMeter3' && <VUMeter variant={3} needleColor="#0d0d0d" stopped={vizStopped} onResumed={onVizResumed} streamUrl={SPECTRUM_STREAM_URL} />}
                  {vizType === 'vuMeter4' && <VUMeter variant={4} needleColor="silver" stopped={vizStopped} onResumed={onVizResumed} streamUrl={SPECTRUM_STREAM_URL} />}
                </div>
              )}
            </div>

            {/* Row 2: Seekbar */}
            <div className="lsp-bottom__row2">
              <PlayerSeekbar readOnly={!showPlayerControls} />
            </div>

            {/* Row 3: Button groups */}
            <div className="lsp-bottom__row3">
              <div className="lsp-btn-group lsp-btn-group--left">
                {menuSlot}
                {showPlayerControls && (
                  <Button classNames={`btn-icon lsp-btn ${isFavourite ? 'active' : ''}`} onClick={toggleFavourite} label={isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}>
                    <span className="material-icons">{isFavourite ? 'favorite' : 'favorite_border'}</span>
                  </Button>
                )}
              </div>
              <div className="lsp-btn-group lsp-btn-group--center">
                <Button classNames={`btn-icon lsp-btn lsp-btn--sm ${repeat ? 'active' : ''}`} onClick={toggleRepeat} label={repeat ? 'Repeat On' : 'Repeat Off'}>
                  <span className="material-icons">repeat</span>
                </Button>
                <Button classNames="btn-round lsp-btn lsp-btn--md" onClick={prev} label="Previous">
                  <span className="material-icons">skip_previous</span>
                </Button>
                <Button classNames="btn-round btn-primary lsp-btn lsp-btn--lg" onClick={handlePlayPause} label={isPlaying ? 'Pause' : 'Play'}>
                  <span className="material-icons play-icon">{isPlaying ? 'pause' : 'play_arrow'}</span>
                </Button>
                <Button classNames="btn-round lsp-btn lsp-btn--md" onClick={next} label="Next">
                  <span className="material-icons">skip_next</span>
                </Button>
                <Button classNames={`btn-icon lsp-btn lsp-btn--sm ${random ? 'active' : ''}`} onClick={toggleRandom} label={random ? 'Shuffle On' : 'Shuffle Off'}>
                  <span className="material-icons">shuffle</span>
                </Button>
              </div>
              <div className="lsp-btn-group lsp-btn-group--right">
                <Button classNames="btn-icon lsp-btn" onClick={() => setShowAddToPlaylist(true)} label="Add to Playlist">
                  <span className="material-icons">playlist_add</span>
                </Button>
                <Button classNames="btn-icon lsp-btn" onClick={() => setShowPlaylist(true)} label="Current Playlist">
                  <span className="material-icons">queue_music</span>
                </Button>
                <Button classNames="btn-icon lsp-btn" onClick={() => setShowBrowse(true)} label="Browse">
                  <span className="material-icons">library_music</span>
                </Button>
                {!disableVolumeControl && (
                  <div className="lsp-volume-btn-wrap position-relative">
                    <Button classNames={`btn-icon lsp-btn ${showVolumePopup ? 'active' : ''}`} onClick={() => setShowVolumePopup((v) => !v)} label="Volume">
                      <span className="material-icons">
                        {(mute || volume === 0) ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up'}
                      </span>
                    </Button>
                    {showVolumePopup && (
                      <VolumePopup volume={volume} mute={mute} onVolumeChange={setVolume} onMute={toggleMute} onClose={() => setShowVolumePopup(false)} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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

      <BrowseDialog open={showBrowse} onClose={() => setShowBrowse(false)} initialFullscreen initialLargeGrid={!isUwls} className="browse-dialog--lsp" />

      <AddToPlaylistDialog
        open={showAddToPlaylist}
        onClose={() => setShowAddToPlaylist(false)}
        track={{ title, artist, album, albumart, uri: queue[position]?.uri, service }}
      />
    </div>
  );
};

LargeScreenPlayer.propTypes = {
  vizStopped: PropTypes.bool,
  onVizResumed: PropTypes.func,
  menuSlot: PropTypes.node,
};

export default LargeScreenPlayer;
