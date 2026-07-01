import { Duration } from 'luxon';
import { useSeek } from '@/contexts/SeekContext';
import usePluginConfig from '@/hooks/usePluginConfig';

const PlayerSeekbar = ({ readOnly }) => {
  const { seek, duration, seekTo } = useSeek();
  const { data: pluginConfig } = usePluginConfig();
  const showRemainingTime = !!pluginConfig?.showRemainingTime;
  const hideSeekHandle = !!pluginConfig?.hideSeekHandle;
  const hideTrackTimes = !!pluginConfig?.hideTrackTimes;

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
  const remainingTime = formatTime(Math.max(durationSeconds - currentSeconds, 0));
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
            aria-label="Seek"
            style={{ cursor: 'pointer', margin: 0 }}
          />
        )}
        <div className="slider-fill position-relative" style={{ width: `${progressPercent}%` }}>
          {!readOnly && !hideSeekHandle && <div className="slider-cap"></div>}
        </div>
      </div>
      {!hideTrackTimes && (
        <div className="seekbar-labels d-flex justify-content-between w-100">
          <span
            className="time-label text-start"
            style={{ lineHeight: 1, fontSize: '0.9em', fontFamily: 'inherit' }}
          >
            {formatTime(currentSeconds)}
          </span>
          <span
            className="time-label text-end"
            style={{ lineHeight: 1, fontSize: '0.9em', fontFamily: 'inherit' }}
          >
            {showRemainingTime
              ? remainingTime !== "0:00" ? `-${remainingTime}` : remainingTime
              : formatTime(durationSeconds)}
          </span>
        </div>
      )}
    </div>
  );
};

export default PlayerSeekbar;
