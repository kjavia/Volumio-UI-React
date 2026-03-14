import PropTypes from 'prop-types';
import Button from './Button';

const PlayerControls = ({ isPlaying, onPlayPause, onNext, onPrev }) => {
  return (
    <div className="player-controls d-flex gap-4 justify-content-center align-items-center my-4">
      <Button classNames="btn-round btn-white" onClick={onPrev} label="Previous">
        <span className="material-icons">skip_previous</span>
      </Button>

      <Button
        classNames="btn-round btn-orange"
        onClick={onPlayPause}
        label={isPlaying ? 'Pause' : 'Play'}
      >
        <span className="material-icons" style={{ fontSize: '24px' }}>
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </Button>

      <Button classNames="btn-round btn-white" onClick={onNext} label="Next">
        <span className="material-icons">skip_next</span>
      </Button>
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
