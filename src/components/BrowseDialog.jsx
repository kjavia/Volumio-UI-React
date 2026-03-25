import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import Dialog from './Dialog';
import Button from './Button';
import TrackItem from './TrackItem';
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

const BrowseDialog = ({ open, onClose }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentNav, setCurrentNav] = useState(null);

  const { data: browseData, isLoading, isError, refetch: refetchBrowse } = useBrowse(currentNav?.uri ?? null);
  const { queue } = useVolumioStatus();
  const { socket } = useSocket();

  const isFavouritesView = currentNav?.uri === 'favourites';

  const queueUris = useMemo(() => new Set((queue ?? []).map((q) => q.uri)), [queue]);

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

  const browseItems = browseData?.lists?.flatMap((l) => l.items) ?? [];

  const filteredItems = search.trim()
    ? browseItems.filter((item) =>
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.artist?.toLowerCase().includes(search.toLowerCase())
      )
    : browseItems;

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

    const containerClass = viewMode === 'grid' ? 'browse-results-grid' : 'browse-results-list';
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
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={currentNav ? currentNav.title : 'Browse'}
      size={isFullscreen ? 'full' : 'lg'}
      className={isFullscreen ? 'browse-dialog--fullscreen' : undefined}
      headerActions={headerActions}
      toolbar={toolbar}
    >
      {currentNav ? renderBrowseResults() : renderHome()}
    </Dialog>
  );
};

BrowseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BrowseDialog;

