import PropTypes from 'prop-types';
import Button from './Button';
import { useTheme } from '@/contexts/ThemeContext';

const VolumeManager = ({ volume, mute, onVolumeChange, onMute, isOnFooter, vertical }) => {
  const { theme } = useTheme();
  const isOled = theme === 'oled';
  const getVolume = () => (mute ? 0 : volume || 0);
  const volumeIcon = getVolume() === 0
    ? (isOled ? '\u00A0' : 'volume_off')
    : getVolume() < 50 ? 'volume_down' : 'volume_up';

  const slider = vertical ? (
    <div
      className="slider-track position-relative"
      style={{ width: '100%', height: '120px', writingMode: 'vertical-lr' }}
    >
      <input
        type="range"
        className="form-range position-absolute opacity-0 z-2"
        min="0"
        max="100"
        value={getVolume() || 0}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        aria-label="Volume"
        orient="vertical"
        style={{ cursor: 'pointer', margin: 0, width: '100%', height: '100%', writingMode: 'vertical-lr' }}
      />
      {/* fill grows from bottom */}
      <div className="position-absolute bottom-0 start-0 w-100" style={{ height: `${getVolume()}%` }}>
        <div className="slider-fill w-100 h-100 position-relative">
          <div className="slider-cap"></div>
        </div>
      </div>
    </div>
  ) : (
    <div className="slider-track position-relative flex-grow-1">
      <input
        type="range"
        className="form-range position-absolute w-100 h-100 top-0 start-0 opacity-0 z-2"
        min="0"
        max="100"
        value={getVolume() || 0}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        aria-label="Volume"
        style={{ cursor: 'pointer', margin: 0 }}
      />
      <div className="slider-fill position-relative" style={{ width: `${getVolume()}%` }}>
        <div className="slider-cap"></div>
      </div>
    </div>
  );

  return (
    <div
      className={`volume-manager d-flex align-items-center gap-2 gap-md-3 ${vertical ? 'flex-column-reverse' : ''} ${isOnFooter ? 'text-white' : 'text-white'}`}
    >
      <Button
        classNames={`btn-icon ${mute ? 'active' : ''}`}
        onClick={onMute}
        label={mute ? 'Unmute' : 'Mute'}
      >
        <span className={`material-icons fs-5 fs-md-4 ${mute ? 'text-white' : ''}`}>
          {volumeIcon}
        </span>
      </Button>

      {slider}

      <div className="text-center small" style={{ fontSize: '0.75em' }}>
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
  vertical: PropTypes.bool,
};

export default VolumeManager;
