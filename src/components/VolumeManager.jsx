import PropTypes from 'prop-types';
import Button from './Button';

const VolumeManager = ({ volume, mute, onVolumeChange, onMute, isOnFooter }) => {
  const getVolume = () => (mute ? 0 : volume || 0);
  return (
    <div
      className={`volume-manager d-flex align-items-center gap-2 gap-md-3 ${isOnFooter ? 'text-white' : 'text-white'}`}
    >
      <Button
        classNames={`btn-icon ${mute ? 'active' : ''}`}
        onClick={onMute}
        label={mute ? 'Unmute' : 'Mute'}
      >
        <span className={`material-icons fs-5 fs-md-4 ${mute ? 'text-orange' : ''}`}>
          {getVolume() === 0 ? 'volume_off' : getVolume() < 50 ? 'volume_down' : 'volume_up'}
        </span>
      </Button>

      <div className="slider-track position-relative flex-grow-1">
        <input
          type="range"
          className="form-range position-absolute w-100 h-100 top-0 start-0 opacity-0 z-2"
          min="0"
          max="100"
          value={getVolume() || 0}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          style={{ cursor: 'pointer', margin: 0 }}
        />
        <div className="slider-fill position-relative" style={{ width: `${getVolume()}%` }}>
          <div className="slider-cap"></div>
        </div>
      </div>
      <div className="text-center text-white small opacity-75" style={{ fontSize: '0.75em' }}>
        {getVolume()} / 100
      </div>
    </div>
  );
};

VolumeManager.propTypes = {
  volume: PropTypes.number,
  mute: PropTypes.bool,
  onVolumeChange: PropTypes.func,
  onMute: PropTypes.func,
  isOnFooter: PropTypes.bool,
};

export default VolumeManager;
