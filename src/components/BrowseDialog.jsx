import PropTypes from 'prop-types';
import Dialog from './Dialog';

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
  return (
    <Dialog open={open} onClose={onClose} title="Browse" size="lg">
      <div className="browse-grid">
        {BROWSE_TILES.map(({ id, label, icon }) => (
          <button key={id} className="browse-tile" aria-label={label}>
            <span className="material-icons browse-tile__icon">{icon}</span>
            <span className="browse-tile__label">{label}</span>
          </button>
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
