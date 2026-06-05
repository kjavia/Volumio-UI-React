import { useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import useVolumioStatus from '@/hooks/useVolumioStatus';
import usePluginConfig from '@/hooks/usePluginConfig';
import { useSeek } from '@/contexts/SeekContext';
import { VOLUMIO_BASE_URL, SPECTRUM_STREAM_URL } from '@/config';
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
import TrackTitle from '@/components/TrackTitle';
import ArtistName from '@/components/ArtistName';
import AlbumName from '@/components/AlbumName';
import PlayerSeekbar from '@/components/PlayerSeekbar';
import VolumeManager from '@/components/VolumeManager';
import SpectrumAnalyzer from '@/components/spectrum-analyzers/SpectrumAnalyzer';
import StreamInfo from '@/components/StreamInfo';
import ServiceLogo from '@/components/ServiceLogo';
import Playlist from '@/components/Playlist';
import AddToPlaylistDialog from '@/components/AddToPlaylistDialog';
import BrowseDialog from '@/components/BrowseDialog';
import PeppyMeter from '@/components/PeppyMeter';
import PeppySpectrum from '@/components/peppy-spectrum/PeppySpectrum';
import SecondaryControls from '@/components/SecondaryControls';

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
  if (s === 'radio' || s.includes('webradio') || s.includes('internet')) return 'radio';
  if (s.includes('qobuz') || s.includes('tidal') || s.includes('deezer') || s.includes('spotify')) return 'globe';
  if (['mp3', 'flac', 'ogg', 'dsd'].includes(t)) return 'cdCover';
  if (s.includes('mp3') || s.includes('flac') || s.includes('ogg') || s.includes('dsd')) return 'cdCover';
  return 'vinylCover';
};

const CustomLayout = ({ layout, vizStopped, onVizResumed }) => {
  console.log('CustomLayout render', { layout });
  const { data: pluginConfig } = usePluginConfig();
  const playerType = pluginConfig?.playerType || 'radio';
  const albumArtMaxSpace = pluginConfig?.albumArtMaxSpace === true;
  const albumArtAnimated = pluginConfig?.albumArtAnimated !== false;
  const vizType = pluginConfig?.vizType || 'spectrum';
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

  const { seek, duration } = useSeek();

  const [randomIndex] = useState(() =>
    Math.floor(Math.random() * RANDOM_PLAYERS.length)
  );

  const effectivePlayerType =
    playerType === 'matchSource' ? getPlayerTypeForSource(service, trackType) : playerType;

  const CurrentPlayerComponent =
    effectivePlayerType === 'random'
      ? RANDOM_PLAYERS[randomIndex]
      : PLAYER_MAP[effectivePlayerType] || AlbumArtPlayer;

  const fullAlbumArt = useMemo(() => {
    if (!albumart) return '';
    if (albumart.startsWith('http')) return albumart;
    return `${VOLUMIO_BASE_URL}${albumart}`;
  }, [albumart]);

  const peppyTrackInfo = useMemo(() => {
    const elapsedSec = seek / 1000;
    const remainingSec = duration > 0 ? Math.max(0, duration - elapsedSec) : 0;
    const fmtTime = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
    return {
      title: title || '',
      artist: artist || '',
      album: album || '',
      albumart: fullAlbumArt,
      samplerate: [samplerate, bitdepth].filter(Boolean).join(' ') || '',
      trackType: trackType || '',
      bitrate: bitrate || '',
      service: service || '',
      remaining: duration > 0 ? fmtTime(remainingSec) : '',
      elapsed: fmtTime(elapsedSec),
      total: duration > 0 ? fmtTime(duration) : '',
      progress: duration > 0 ? elapsedSec / duration : 0,
      volume: volume || 0,
      mute: !!mute,
      isPlaying: !!isPlaying,
      repeat: repeat || false,
      random: random || false,
    };
  }, [seek, duration, title, artist, album, fullAlbumArt, samplerate, bitdepth, trackType, bitrate, service, volume, mute, isPlaying, repeat, random]);

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showBrowse, setShowBrowse] = useState(false);
  const vizRef = useRef(null);

  const handlePlayPause = () => {
    vizRef.current?.enable();
    togglePlay();
  };

  const renderCellItem = (itemKey) => {
    switch (itemKey) {
      case 'trackName':
        return <TrackTitle title={title} />;
      case 'albumName':
        return <AlbumName album={album} />;
      case 'artistName':
        return <ArtistName artist={artist} />;
      case 'serviceLogo':
        return <div className="custom-layout-media"><ServiceLogo service={service} /></div>;
      case 'samplingRate':
        return (
          <div className="custom-layout-media custom-layout-media--small">
            <StreamInfo
              trackType={trackType}
              codec={codec}
              samplerate={samplerate}
              bitdepth={bitdepth}
              bitrate={bitrate}
            />
          </div>
        );
      case 'playerControls':
        return (
          <div className="custom-layout-controls">
            <PlayerControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onNext={next}
              onPrev={prev}
            />
          </div>
        );
      case 'player':
        return (
          <div className="custom-layout-player">
            <CurrentPlayerComponent
              isPlaying={isPlaying}
              albumArt={fullAlbumArt}
              maxSpace={albumArtMaxSpace && effectivePlayerType === 'albumArt'}
              animated={albumArtAnimated && effectivePlayerType === 'albumArt'}
            />
          </div>
        );
      case 'viz':
        return (
          <div className="custom-layout-viz">
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
              <PeppyMeter folder={peppyMeterFolder} model={peppyMeterModel} trackUri={streamUri} trackInfo={peppyTrackInfo} stopped={!isPlaying} />
            )}
            {vizType === 'peppySpectrum' && (
              <PeppySpectrum folder={peppySpectrumFolder} model={peppySpectrumModel} trackUri={streamUri} stopped={!isPlaying} />
            )}
            {vizType === 'none' && <span className="material-icons viz-placeholder">equalizer</span>}
          </div>
        );
      case 'buttonRow':
        return (
          <div className="custom-layout-button-row">
            <SecondaryControls
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
          </div>
        );
      case 'volumeSlider':
        return (
          <div className="custom-layout-volume">
            <VolumeManager
              volume={volume}
              mute={mute}
              onVolumeChange={setVolume}
              onMute={toggleMute}
            />
          </div>
        );
      case 'volumeButton':
        return (
          <div className="custom-layout-volume">
            <VolumeManager
              volume={volume}
              mute={mute}
              onVolumeChange={setVolume}
              onMute={toggleMute}
              vertical
            />
          </div>
        );
      case 'progressBar':
        return (
          <div className="custom-layout-seekbar w-100">
            <PlayerSeekbar />
          </div>
        );
      default:
        return null;
    }
  };

  const renderCells = (cells) => {
    // Iterate cells directly, skipping null placeholders (from rowSpan merges).
    // CSS Grid auto-placement handles position correctly for both colSpan and rowSpan cells.
    // Using findCellCovering caused cells after a colSpan-merged cell to be silently dropped.
    const rendered = [];
    cells.forEach((rowCells) => {
      if (!rowCells) return;
      rowCells.forEach((cell) => {
        if (!cell) return; // null = placeholder from a rowSpan merge, skip

        const justifyToTextAlign = { 'flex-start': 'left', 'flex-end': 'right', 'center': 'center' };
        const style = {
          alignItems: cell.alignItems || 'center',
          justifyContent: cell.justifyContent || 'center',
          textAlign: justifyToTextAlign[cell.justifyContent] || 'center',
          display: 'flex',
          overflow: 'hidden',
        };
        if (cell.colSpan > 1) style.gridColumn = `span ${cell.colSpan}`;
        if (cell.rowSpan > 1) style.gridRow = `span ${cell.rowSpan}`;

        const subColFr = Array.isArray(cell.subdivisions?.colFractions) && cell.subdivisions.colFractions.length
          ? cell.subdivisions.colFractions
          : Array(cell.subdivisions?.cols || 1).fill(1);
        const subRowFr = Array.isArray(cell.subdivisions?.rowFractions) && cell.subdivisions.rowFractions.length
          ? cell.subdivisions.rowFractions
          : Array(cell.subdivisions?.rows || 1).fill(1);

        rendered.push(
          <div key={cell.id} className="custom-layout-cell" style={style}>
            {cell.subdivisions ? (
              <div
                style={{
                  display: 'grid',
                  width: '100%',
                  height: '100%',
                  gridTemplateColumns: subColFr.map((f) => `${f}fr`).join(' '),
                  gridTemplateRows: subRowFr.map((f) => `${f}fr`).join(' '),
                }}
              >
                {renderCells(cell.subdivisions.cells)}
              </div>
            ) : cell.itemKey ? (
              renderCellItem(cell.itemKey)
            ) : null}
          </div>
        );
      });
    });
    return rendered;
  };

  const cols = layout.cols || 1;
  const rows = layout.rows || 1;
  const colFractions =
    Array.isArray(layout.colFractions) && layout.colFractions.length === cols
      ? layout.colFractions
      : Array(cols).fill(1);
  const rowFractions =
    Array.isArray(layout.rowFractions) && layout.rowFractions.length === rows
      ? layout.rowFractions
      : Array(rows).fill(1);

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

      <div
        className="custom-layout-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: colFractions.map((f) => `${f}fr`).join(' '),
          gridTemplateRows: rowFractions.map((f) => `${f}fr`).join(' '),
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {renderCells(layout.cells)}
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

CustomLayout.propTypes = {
  layout: PropTypes.shape({
    cols: PropTypes.number,
    rows: PropTypes.number,
    colFractions: PropTypes.arrayOf(PropTypes.number),
    rowFractions: PropTypes.arrayOf(PropTypes.number),
    cells: PropTypes.array.isRequired,
  }).isRequired,
  vizStopped: PropTypes.bool,
  onVizResumed: PropTypes.func,
};

export default CustomLayout;
