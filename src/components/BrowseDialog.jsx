import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import Dialog from './Dialog';
import Button from './Button';
import TrackItem from './TrackItem';
import AddToPlaylistDialog from './AddToPlaylistDialog';
import useBrowse from '@/hooks/useBrowse';
import useVolumioStatus from '@/hooks/useVolumioStatus';
import { useSocket } from '@/contexts/SocketContext';

const BROWSE_TILES = [
  { id: 'favourites',    label: 'Favorites',    icon: 'favorite',      uri: 'favourites' },
  { id: 'playlists',     label: 'Playlists',    icon: 'queue_music',   uri: 'playlists' },
  { id: 'music-library', label: 'Music Library',icon: 'library_music', uri: 'music-library' },
  { id: 'artists',       label: 'Artists',      icon: 'person',        uri: 'artists://' },
  { id: 'albums',        label: 'Albums',       icon: 'album',         uri: 'albums://' },
  { id: 'genres',        label: 'Genres',       icon: 'category',      uri: 'genres://' },
  { id: 'last-100',      label: 'Last 100',     icon: 'history',       uri: 'Last_100' },
  { id: 'web-radio',     label: 'Web Radio',    icon: 'radio',         uri: 'radio' },
];

// Formats total seconds into a human-readable duration string, e.g. "1h 23m" or "45m 12s"
const formatTotalDuration = (totalSecs) => {
  if (!totalSecs) return null;
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

// Maps a (lowercase) format name to its logo path
const FORMAT_LOGO_MAP = {
  flac: '/assets/logos/flac.svg',
  mp3: '/assets/logos/mp3.svg',
  wav: '/assets/logos/wav.svg',
  aiff: '/assets/logos/aiff.svg',
  aif: '/assets/logos/aiff.svg',
  dsd: '/assets/logos/dsd.svg',
  dsf: '/assets/logos/dsd.svg',
  dff: '/assets/logos/dsd.svg',
};

// Known extensions we can recognise for the chip label
const FORMAT_EXTS = new Set([
  'flac', 'mp3', 'aac', 'wav', 'ogg', 'aiff', 'aif', 'alac', 'm4a',
  'opus', 'wma', 'dsf', 'dff', 'ape', 'mpc',
]);

// Derives a lowercase format key from an item — prefers trackType, falls back to URI extension
const itemFormat = (item) => {
  const tt = item.trackType?.toLowerCase();
  if (tt) return tt;
  const ext = item.uri?.split('?')[0].split('.').pop().toLowerCase();
  return (ext && FORMAT_EXTS.has(ext)) ? ext : null;
};

const BrowseDialog = ({ open, onClose }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [largeGrid, setLargeGrid] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentNav, setCurrentNav] = useState(null);
  const [albumMenuOpen, setAlbumMenuOpen] = useState(false);
  const [albumMenuPos, setAlbumMenuPos] = useState({ top: 0, left: 0 });
  const [albumAddToPlaylistOpen, setAlbumAddToPlaylistOpen] = useState(false);
  const albumMenuBtnRef = useRef(null);
  const albumMenuRef = useRef(null);

  const { data: browseData, isLoading, isError, refetch: refetchBrowse } = useBrowse(currentNav?.uri ?? null);
  const { queue } = useVolumioStatus();
  const { socket } = useSocket();

  const isFavouritesView = currentNav?.uri === 'favourites';
  const isPlaylistsView = currentNav?.uri === 'playlists';

  const queueUris = useMemo(() => new Set((queue ?? []).map((q) => q.uri)), [queue]);

  const browseItems = browseData?.lists?.flatMap((l) => l.items) ?? [];
  const albumInfo = browseData?.info ?? null;
  const albumArtist = albumInfo?.artist
    || browseItems.find((i) => i.artist)?.artist
    || null;

  const albumPayload = useMemo(() => ({
    uri: currentNav?.uri,
    service: browseItems[0]?.service,
    title: currentNav?.title,
    artist: albumArtist,
    albumart: browseItems.find((i) => i.albumart)?.albumart,
    type: 'folder',
  }), [currentNav, browseItems, albumArtist]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!albumMenuOpen) return;
    const handleClickOutside = (e) => {
      if (
        albumMenuRef.current && !albumMenuRef.current.contains(e.target) &&
        albumMenuBtnRef.current && !albumMenuBtnRef.current.contains(e.target)
      ) {
        setAlbumMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [albumMenuOpen]);

  const openAlbumMenu = useCallback((e) => {
    e.stopPropagation();
    const rect = albumMenuBtnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuHeight ? rect.bottom + 4 : rect.top - menuHeight - 4;
    const left = Math.min(rect.right - 180, window.innerWidth - 188);
    setAlbumMenuPos({ top, left });
    setAlbumMenuOpen((v) => !v);
  }, []);

  const closeAlbumMenu = useCallback(() => setAlbumMenuOpen(false), []);

  const handleAlbumPlay = useCallback(() => {
    socket?.emit('replaceAndPlay', albumPayload);
    closeAlbumMenu();
  }, [socket, albumPayload, closeAlbumMenu]);

  const handleAlbumAddToQueue = useCallback(() => {
    socket?.emit('addToQueue', albumPayload);
    closeAlbumMenu();
  }, [socket, albumPayload, closeAlbumMenu]);

  const handleAlbumClearAndPlay = useCallback(() => {
    socket?.emit('clearQueue');
    socket?.emit('replaceAndPlay', albumPayload);
    closeAlbumMenu();
  }, [socket, albumPayload, closeAlbumMenu]);

  const handleAlbumUpdateFolder = useCallback(() => {
    socket?.emit('updateDb', currentNav?.uri);
    closeAlbumMenu();
  }, [socket, currentNav, closeAlbumMenu]);

  const handleAlbumOpenAddToPlaylist = useCallback(() => {
    closeAlbumMenu();
    setAlbumAddToPlaylistOpen(true);
  }, [closeAlbumMenu]);

  const handlePlayAllFavourites = useCallback(() => {
    const items = browseData?.lists?.flatMap((l) => l.items) ?? [];
    if (items.length === 0) return;
    socket?.emit('clearQueue');
    items.forEach((item) => socket?.emit('addToQueue', {
      uri: item.uri,
      service: item.service,
      title: item.title,
      artist: item.artist,
      album: item.album,
      albumart: item.albumart,
      type: item.type,
    }));
    socket?.emit('play', { value: 0 });
  }, [socket, browseData]);

  const navigate = useCallback((uri, title) => {
    setHistory((h) => currentNav ? [...h, currentNav] : h);
    setCurrentNav({ uri, title });
    setSearch('');
  }, [currentNav]);

  const goBack = useCallback(() => {
    if (history.length === 0) {
      setCurrentNav(null);
    } else {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setCurrentNav(prev);
    }
    setSearch('');
  }, [history]);

  const goHome = useCallback(() => {
    setHistory([]);
    setCurrentNav(null);
    setSearch('');
  }, []);

  const filteredItems = search.trim()
    ? browseItems.filter((item) =>
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.artist?.toLowerCase().includes(search.toLowerCase())
      )
    : browseItems;

  // Album view: all items are songs (no search applied — use raw list)
  const isAlbumView = !isLoading && !isError && browseItems.length > 0
    && browseItems.every((i) => i.type === 'song');

  const albumYear = albumInfo?.year ?? null;

  const trackCount = browseItems.length;
  const totalDuration = browseItems.reduce((sum, i) => sum + (i.duration || 0), 0);

  // Audio format: prefer trackType on items, fall back to URI extension.
  // Collect unique formats and build one chip per format.
  const uniqueFormats = [...new Set(browseItems.map(itemFormat).filter(Boolean))];

  // Best quality sample (first item that has samplerate/bitdepth/bitrate data)
  const qualitySample = browseItems.find((i) => i.samplerate || i.bitdepth || i.bitrate) ?? null;

  const albumFooter = isAlbumView ? (
    <div className="album-footer">
      {albumArtist && (
        <span className="album-footer__chip">
          <span className="material-icons">person</span>
          {albumArtist}
        </span>
      )}
      <span className="album-footer__chip">
        <span className="material-icons">music_note</span>
        {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
      </span>
      {totalDuration > 0 && (
        <span className="album-footer__chip">
          <span className="material-icons">schedule</span>
          {formatTotalDuration(totalDuration)}
        </span>
      )}
      {albumYear && (
        <span className="album-footer__chip">
          <span className="material-icons">calendar_today</span>
          {albumYear}
        </span>
      )}
      {uniqueFormats.map((fmt) => {
        const logoSrc = FORMAT_LOGO_MAP[fmt];
        return (
          <span key={fmt} className="album-footer__chip album-footer__chip--format">
            {logoSrc
              ? <img src={logoSrc} alt={fmt} className="album-footer__format-logo" />
              : <span className="album-footer__format-text">{fmt.toUpperCase()}</span>
            }
          </span>
        );
      })}
      {qualitySample && (
        <span className="album-footer__chip">
          {[qualitySample.samplerate, qualitySample.bitdepth].filter(Boolean).join(' / ')
            || qualitySample.bitrate}
        </span>
      )}
    </div>
  ) : null;

  const headerActions = (
    <button
      type="button"
      className="dialog-close"
      onClick={() => setIsFullscreen((v) => !v)}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
    >
      <span className="material-icons">
        {isFullscreen ? 'filter_none' : 'crop_square'}
      </span>
    </button>
  );

  const toolbar = (
    <div className="browse-toolbar">
      <div className="browse-toolbar__left">
        <Button classNames="btn-icon" label="Home" onClick={goHome}>
          <span className="material-icons">home</span>
        </Button>
        <Button
          classNames={`btn-icon${!currentNav ? ' disabled' : ''}`}
          label="Back"
          onClick={goBack}
          disabled={!currentNav}
        >
          <span className="material-icons">arrow_back</span>
        </Button>
        <Button
          classNames={`btn-icon${viewMode === 'grid' ? ' active' : ''}`}
          label="Grid view"
          onClick={() => setViewMode('grid')}
        >
          <span className="material-icons">grid_view</span>
        </Button>
        <Button
          classNames={`btn-icon${viewMode === 'list' ? ' active' : ''}`}
          label="List view"
          onClick={() => setViewMode('list')}
        >
          <span className="material-icons">view_list</span>
        </Button>
        {viewMode === 'grid' && (
          <Button
            classNames={`btn-icon${largeGrid ? ' active' : ''}`}
            label={largeGrid ? 'Normal size' : 'Large tiles'}
            onClick={() => setLargeGrid((v) => !v)}
          >
            <span className="material-icons">{largeGrid ? 'zoom_out' : 'zoom_in'}</span>
          </Button>
        )}
      </div>
      <div className="browse-toolbar__right">
        <div className="browse-search">
          <span className="material-icons browse-search__icon">search</span>
          <input
            className="browse-search__input"
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search"
          />
        </div>
        {isAlbumView && (
          <button
            ref={albumMenuBtnRef}
            className="btn-icon"
            type="button"
            aria-label="Album options"
            onClick={openAlbumMenu}
          >
            <span className="material-icons">more_vert</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderHome = () => (
    <div className={viewMode === 'grid' ? 'browse-grid' : 'browse-list'}>
      {BROWSE_TILES.map(({ id, label, icon, uri }) => (
        <Button key={id} label={label} classNames="browse-tile" onClick={() => navigate(uri, label)}>
          <span className="material-icons browse-tile__icon">{icon}</span>
          <span className="browse-tile__label">{label}</span>
        </Button>
      ))}
    </div>
  );

  const renderBrowseResults = () => {
    if (isLoading) {
      return (
        <div className="browse-status">
          <span className="material-icons browse-status__icon spin">refresh</span>
          <span>Loading…</span>
        </div>
      );
    }
    if (isError) {
      return (
        <div className="browse-status browse-status--error">
          <span className="material-icons browse-status__icon">error_outline</span>
          <span>Failed to load. Try again.</span>
        </div>
      );
    }
    if (filteredItems.length === 0) {
      return (
        <div className="browse-status">
          <span className="material-icons browse-status__icon">inbox</span>
          <span>No items found.</span>
        </div>
      );
    }

    const containerClass = viewMode === 'grid'
      ? `browse-results-grid${largeGrid ? ' browse-results-grid--large' : ''}`
      : 'browse-results-list';
    return (
      <div className={containerClass}>
        {isFavouritesView && (
          <button className="browse-play-all" onClick={handlePlayAllFavourites}>
            <span className="material-icons">playlist_play</span>
            <span>Play All</span>
          </button>
        )}
        {filteredItems.map((item, i) => (
          <TrackItem
            key={item.uri ?? i}
            item={item}
            viewMode={viewMode}
            onNavigate={navigate}
            queueUris={queueUris}
            onFavouriteToggled={isFavouritesView ? refetchBrowse : undefined}
            isPlaylistItem={isPlaylistsView}
            onPlaylistDeleted={isPlaylistsView ? refetchBrowse : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={currentNav ? currentNav.title : 'Browse'}
        size={isFullscreen ? 'full' : 'lg'}
        className={isFullscreen ? 'browse-dialog--fullscreen' : undefined}
        headerActions={headerActions}
        toolbar={toolbar}
        footer={albumFooter}
      >
        {currentNav ? renderBrowseResults() : renderHome()}
      </Dialog>
      {albumMenuOpen && createPortal(
        <div
          ref={albumMenuRef}
          className="track-menu"
          style={{ position: 'fixed', top: albumMenuPos.top, left: albumMenuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="track-menu__item" onClick={handleAlbumPlay}>
            <span className="material-icons">play_arrow</span>
            Play
          </button>
          <button className="track-menu__item" onClick={handleAlbumAddToQueue}>
            <span className="material-icons">queue_music</span>
            Add to Queue
          </button>
          <button className="track-menu__item" onClick={handleAlbumClearAndPlay}>
            <span className="material-icons">playlist_play</span>
            Clear &amp; Play
          </button>
          <div className="track-menu__separator" />
          <button className="track-menu__item" onClick={handleAlbumOpenAddToPlaylist}>
            <span className="material-icons">playlist_add</span>
            Add to Playlist
          </button>
          <button className="track-menu__item" onClick={handleAlbumUpdateFolder}>
            <span className="material-icons">refresh</span>
            Update Folder
          </button>
        </div>,
        document.body
      )}
      {albumAddToPlaylistOpen && (
        <AddToPlaylistDialog
          open={albumAddToPlaylistOpen}
          onClose={() => setAlbumAddToPlaylistOpen(false)}
          track={albumPayload}
        />
      )}
    </>
  );
};

BrowseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BrowseDialog;

