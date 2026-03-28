import React, { useRef } from 'react';
import { Duration } from 'luxon';
import { useSeek } from '@/contexts/SeekContext';

const PlayerSeekbar = ({ readOnly }) => {
  const seekRef = useRef(null);
  const { seek, duration, seekTo } = useSeek();

  const handleSeek = (e) => {
    if (readOnly) return;
    seekTo(Number(e.target.value));
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    return Duration.fromObject({ seconds }).toFormat('m:ss');
  };

  const currentSeconds = Math.floor(seek / 1000);
  const durationSeconds = duration || 0;
  const progressPercent = durationSeconds > 0 ? Math.min((currentSeconds / durationSeconds) * 100, 100) : 0;

  return (
    <div className={`slider-container ${readOnly ? 'read-only' : ''}`}>
      <span
        className="time-label text-end text-white fw-bold"
        style={{ lineHeight: 1 }}
      >
        {formatTime(currentSeconds)}
      </span>
      <div className="slider-track position-relative flex-grow-1">
        {!readOnly && (
          <input
            type="range"
            className="form-range position-absolute w-100 h-100 top-0 start-0 opacity-0 z-2"
            min="0"
            max={durationSeconds}
            value={currentSeconds}
            onChange={handleSeek}
            style={{ cursor: 'pointer', margin: 0 }}
          />
        )}
        <div className="slider-fill position-relative" style={{ width: `${progressPercent}%` }}>
          {!readOnly && <div className="slider-cap"></div>}
        </div>
      </div>
      <span
        className="time-label text-start text-white fw-bold"
        style={{ lineHeight: 1 }}
      >
        {formatTime(durationSeconds)}
      </span>
    </div>
  );
};

export default PlayerSeekbar;
