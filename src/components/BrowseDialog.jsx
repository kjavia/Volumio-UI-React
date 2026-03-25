import { useState } from 'react';
import PropTypes from 'prop-types';
import Dialog from './Dialog';
import Button from './Button';

const BROWSE_TILES = [
  { id: 'favourites', label: 'Favorites', icon: 'favorite' },
  { id: 'playlists', label: 'Playlists', icon: 'queue_music' },
  { id: 'music-library', label: 'Music Library', icon: 'library_music' },
  { id: 'artists', label: 'Artists', icon: 'person' },
  { id: 'albums', label: 'Albums', icon: 'album' },
  { id: 'genres', label: 'Genres', icon: 'category' },
  { id: 'last-100', label: 'Last 100', icon: 'history' },
  { id: 'web-radio', label: 'Web Radio', icon: 'radio' },
];

const BrowseDialog = ({ open, onClose }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        <Button classNames="btn-icon" label="Home">
          <span className="material-icons">home</span>
        </Button>
        <Button classNames="btn-icon" label="Back">
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Browse"
      size={isFullscreen ? 'full' : 'lg'}
      className={isFullscreen ? 'browse-dialog--fullscreen' : undefined}
      headerActions={headerActions}
      toolbar={toolbar}
    >
      <div className={viewMode === 'grid' ? 'browse-grid' : 'browse-list'}>
        {BROWSE_TILES.map(({ id, label, icon }) => (
          <Button key={id} label={label} classNames="browse-tile">
            <span className="material-icons browse-tile__icon">{icon}</span>
            <span className="browse-tile__label">{label}</span>
          </Button>
        ))}
      </div>
    </Dialog>
  );
};

BrowseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BrowseDialog;

