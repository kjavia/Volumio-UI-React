import PropTypes from 'prop-types';
import Button from './Button';

const SecondaryControls = ({
    shuffle,
    repeat,
    onShuffle,
    onRepeat,
    onAddToPlaylist,
    onShowPlaylist,
    onBrowse,
    isFavourite,
    onToggleFavourite,
}) => {
    return (
        <div className="d-flex gap-3 gap-md-4 align-items-center justify-content-center flex-wrap">
            <Button
                classNames={`btn-icon ${shuffle ? 'active' : ''}`}
                onClick={onShuffle}
                label={shuffle ? 'Shuffle On' : 'Shuffle Off'}
            >
                <span className="material-icons">shuffle</span>
            </Button>

            <Button
                classNames={`btn-icon ${repeat ? 'active' : ''}`}
                onClick={onRepeat}
                label={repeat ? 'Repeat On' : 'Repeat Off'}
            >
                <span className="material-icons">repeat</span>
            </Button>

            <Button classNames="btn-icon" onClick={onAddToPlaylist} label="Add to Playlist">
                <span className="material-icons">playlist_add</span>
            </Button>

            <Button
                classNames={`btn-icon ${isFavourite ? 'active' : ''}`}
                onClick={onToggleFavourite}
                label={isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
            >
                <span className="material-icons">{isFavourite ? 'favorite' : 'favorite_border'}</span>
            </Button>

            <Button classNames="btn-icon btn-text" onClick={onShowPlaylist} label="Show Playlist">
                <span className="material-icons">queue_music</span>
            </Button>

            <Button classNames="btn-icon btn-text" onClick={onBrowse} label="Browse">
                <span className="material-icons">library_music</span>
            </Button>
        </div>
    );
};

SecondaryControls.propTypes = {
    shuffle: PropTypes.bool,
    repeat: PropTypes.bool,
    onShuffle: PropTypes.func,
    onRepeat: PropTypes.func,
    onAddToPlaylist: PropTypes.func,
    onShowPlaylist: PropTypes.func,
    onBrowse: PropTypes.func,
    isFavourite: PropTypes.bool,
    onToggleFavourite: PropTypes.func,
};

export default SecondaryControls;
