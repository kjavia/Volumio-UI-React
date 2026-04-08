import { Duration } from 'luxon';
import { useSeek } from '@/contexts/SeekContext';

const PlayerSeekbar = ({ readOnly }) => {
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
      <div className="seekbar-labels d-flex justify-content-between w-100">
        <span
          className="time-label text-start text-white opacity-75"
          style={{ lineHeight: 1, fontSize: '0.9em', fontFamily: 'inherit' }}
        >
          {formatTime(currentSeconds)}
        </span>
        <span
          className="time-label text-end text-white opacity-75"
          style={{ lineHeight: 1, fontSize: '0.9em', fontFamily: 'inherit' }}
        >
          {formatTime(durationSeconds)}
        </span>
      </div>
    </div>
  );
};

export default PlayerSeekbar;
