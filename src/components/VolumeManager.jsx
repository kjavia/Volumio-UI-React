import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';

const VolumeManager = ({ volume, mute, onVolumeChange, onMute, isOnFooter }) => {
  return (
    <div
      className={`volume-manager d-flex align-items-center gap-2 gap-md-3 ${isOnFooter ? 'text-white' : 'text-white'}`}
    >
      <Button
        classNames={`btn-square ${mute ? 'active' : ''}`}
        onClick={onMute}
        label={mute ? 'Unmute' : 'Mute'}
      >
        <span className={`material-icons fs-5 fs-md-4 ${mute ? 'text-orange' : ''}`}>
          {mute || volume === 0 ? 'volume_off' : volume < 50 ? 'volume_down' : 'volume_up'}
        </span>
      </Button>

      <div className="slider-track position-relative flex-grow-1">
        <input
          type="range"
          className="form-range position-absolute w-100 h-100 top-0 start-0 opacity-0 z-2"
          min="0"
          max="100"
          value={volume || 0}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          style={{ cursor: 'pointer', margin: 0 }}
        />
        <div className="slider-fill position-relative" style={{ width: `${volume || 0}%` }}>
          <div className="slider-cap"></div>
        </div>
      </div>
      <span
        className="small text-white-50 ms-1 fw-bold text-center"
        style={{ width: '30px', fontSize: '0.8rem' }}
      >
        {volume}
      </span>
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
