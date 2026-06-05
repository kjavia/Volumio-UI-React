import PropTypes from 'prop-types';
import Button from './Button';

const PlayerControls = ({
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
}) => {
  return (
    <div className="player-controls d-flex align-items-center justify-content-center w-100">
      <div className="controls-transport-row d-flex gap-3 align-items-center justify-content-center">
        <Button classNames="btn-round btn-sm" onClick={onPrev} label="Previous">
          <span className="material-icons">skip_previous</span>
        </Button>

        <Button
          classNames="btn-round btn-primary"
          onClick={onPlayPause}
          label={isPlaying ? 'Pause' : 'Play'}
        >
          <span className={`material-icons play-icon ${isPlaying ? 'is-pause' : 'is-play'}`}>{isPlaying ? 'pause' : 'play_arrow'}</span>
        </Button>

        <Button classNames="btn-round btn-sm" onClick={onNext} label="Next">
          <span className="material-icons">skip_next</span>
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
};

export default PlayerControls;
