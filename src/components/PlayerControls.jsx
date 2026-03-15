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
}) => {
  return (
    <div className="player-controls d-flex justify-content-between align-items-center my-2 my-md-4 w-100 px-lg-4">
      <Button
        classNames={`btn-square ${repeat ? 'active' : ''}`}
        onClick={onRepeat}
        label={repeat ? 'Repeat On' : 'Repeat Off'}
      >
        <span className={`material-icons fs-5 fs-md-4 ${repeat ? 'text-orange' : ''}`}>repeat</span>
      </Button>

      <div className="d-flex gap-3 gap-md-4 align-items-center justify-content-center">
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

      <Button
        classNames={`btn-square ${shuffle ? 'active' : ''}`}
        onClick={onShuffle}
        label={shuffle ? 'Shuffle On' : 'Shuffle Off'}
      >
        <span className={`material-icons fs-5 fs-md-4 ${shuffle ? 'text-orange' : ''}`}>
          shuffle
        </span>
      </Button>
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
};

export default PlayerControls;
