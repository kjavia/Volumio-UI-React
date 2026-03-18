import React, { useRef } from 'react';
import { Duration } from 'luxon';
import { useSeek } from '@/contexts/SeekContext';

const PlayerSeekbar = () => {
  const seekRef = useRef(null);
  const { seek, duration, seekTo } = useSeek();

  const handleSeek = (e) => {
    seekTo(Number(e.target.value));
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    return Duration.fromObject({ seconds }).toFormat('m:ss');
  };

  const currentSeconds = Math.floor(seek / 1000);
  const durationSeconds = duration || 0;
  const progressPercent = durationSeconds > 0 ? (currentSeconds / durationSeconds) * 100 : 0;

  return (
    <div className="slider-container px-2 px-md-3">
      <span
        className="time-label text-end text-white-50"
        style={{ fontSize: '0.75rem', width: '35px' }}
      >
        {formatTime(currentSeconds)}
      </span>
      <div className="slider-track position-relative flex-grow-1 mx-2">
        <input
          type="range"
          className="form-range position-absolute w-100 h-100 top-0 start-0 opacity-0 z-2"
          min="0"
          max={durationSeconds}
          value={currentSeconds}
          onChange={handleSeek}
          style={{ cursor: 'pointer', margin: 0 }}
        />
        <div className="slider-fill position-relative" style={{ width: `${progressPercent}%` }}>
          <div className="slider-cap"></div>
        </div>
      </div>
      <span
        className="time-label text-start text-white-50"
        style={{ fontSize: '0.75rem', width: '35px' }}
      >
        {formatTime(durationSeconds)}
      </span>
    </div>
  );
};

export default PlayerSeekbar;
