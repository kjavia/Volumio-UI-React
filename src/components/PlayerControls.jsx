import PropTypes from 'prop-types';
import Button from './Button';

const PlayerControls = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  shuffle,
  repeat,
  onShuffle,
  onRepeat,
  onAddToPlaylist,
  onShowPlaylist,
}) => {
  return (
    <div className="player-controls d-flex flex-column align-items-center w-100">
      {/* Main transport controls */}
      <div className="d-flex gap-3 gap-md-4 align-items-center justify-content-center my-2 my-md-4">
        <Button classNames="btn-round btn-white" onClick={onPrev} label="Previous">
          <span className="material-icons fs-5 fs-md-4">skip_previous</span>
        </Button>

        <Button
          classNames="btn-round btn-orange"
          onClick={onPlayPause}
          label={isPlaying ? 'Pause' : 'Play'}
        >
          <span className="material-icons fs-4 fs-md-3">{isPlaying ? 'pause' : 'play_arrow'}</span>
        </Button>

        <Button classNames="btn-round btn-white" onClick={onNext} label="Next">
          <span className="material-icons fs-5 fs-md-4">skip_next</span>
        </Button>
      </div>

      {/* Secondary controls: shuffle, repeat, add to playlist, show playlist */}
      <div className="d-flex gap-3 gap-md-4 align-items-center justify-content-center">
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

        <Button classNames="btn-icon" onClick={onShowPlaylist} label="Show Playlist">
          <span className="material-icons">queue_music</span>
        </Button>
      </div>
    </div>
  );
};

PlayerControls.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
  onPlayPause: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  shuffle: PropTypes.bool,
  repeat: PropTypes.bool,
  onShuffle: PropTypes.func,
  onRepeat: PropTypes.func,
  onAddToPlaylist: PropTypes.func,
  onShowPlaylist: PropTypes.func,
};

export default PlayerControls;
