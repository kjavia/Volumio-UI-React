import { useState, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import useWeather from '@/hooks/useWeather';

// Segment map: [a, b, c, d, e, f, g]
//  _a_
// |   |
// f   b
// |_g_|
// |   |
// e   c
// |_d_|
const SEGMENT_MAP = [
  [1, 1, 1, 1, 1, 1, 0], // 0
  [0, 1, 1, 0, 0, 0, 0], // 1
  [1, 1, 0, 1, 1, 0, 1], // 2
  [1, 1, 1, 1, 0, 0, 1], // 3
  [0, 1, 1, 0, 0, 1, 1], // 4
  [1, 0, 1, 1, 0, 1, 1], // 5
  [1, 0, 1, 1, 1, 1, 1], // 6
  [1, 1, 1, 0, 0, 0, 0], // 7
  [1, 1, 1, 1, 1, 1, 1], // 8
  [1, 1, 1, 1, 0, 1, 1], // 9
];

const SEG_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

const SegmentDigit = memo(({ digit }) => {
  const segs = SEGMENT_MAP[digit] || SEGMENT_MAP[0];
  return (
    <div className="lcd-digit">
      {SEG_NAMES.map((name, i) => (
        <div key={name} className={`seg seg-${name} ${segs[i] ? 'on' : 'off'}`} />
      ))}
    </div>
  );
});
SegmentDigit.displayName = 'SegmentDigit';

const LcdColon = memo(({ blink = false }) => (
  <div className={`lcd-colon${blink ? ' lcd-colon--blink' : ''}`}>
    <div className="lcd-colon-dot" />
    <div className="lcd-colon-dot" />
  </div>
));
LcdColon.displayName = 'LcdColon';

const DigitalClock = ({ showSeconds = true, use12Hour = true, showWeather = false }) => {
  const { i18n } = useTranslation();
  const { data: weather } = useWeather();
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    let intervalId;
    const tick = () => setTime(new Date());

    if (showSeconds) {
      // Sync to the next second boundary
      const msToNextSecond = 1000 - new Date().getMilliseconds();
      const syncTimeout = setTimeout(() => {
        tick();
        intervalId = setInterval(tick, 1000);
      }, msToNextSecond);
      return () => {
        clearTimeout(syncTimeout);
        if (intervalId) clearInterval(intervalId);
      };
    } else {
      // Colon blink is CSS-only — only tick when minutes change
      const now = new Date();
      const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      const syncTimeout = setTimeout(() => {
        tick();
        intervalId = setInterval(tick, 60000);
      }, msToNextMinute);
      return () => {
        clearTimeout(syncTimeout);
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, [showSeconds]);

  let hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const dayIndex = time.getDay();

  // Jan 7 2001 was a Sunday — generate locale-aware short day names
  const DAYS = Array.from({ length: 7 }, (_, i) =>
    new Date(2001, 0, 7 + i).toLocaleDateString(i18n.language, { weekday: 'short' }).toUpperCase()
  );

  let ampm = '';
  if (use12Hour) {
    ampm = new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', hour12: true })
      .formatToParts(time)
      .find(p => p.type === 'dayPeriod')?.value ?? (hours >= 12 ? 'PM' : 'AM');
    hours = hours % 12 || 12;
  }

  const h = String(hours).padStart(2, '0').split('').map(Number);
  const m = String(minutes).padStart(2, '0').split('').map(Number);
  const s = String(seconds).padStart(2, '0').split('').map(Number);

  const dateString = time.toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="digital-clock-wrapper">
      <div className="digital-clock-frame">
        <div className="digital-clock">
          {/* Day-of-week bar */}
          <div className="lcd-days">
            {DAYS.map((day, i) => (
              <span key={day} className={i === dayIndex ? 'active' : ''}>
                {day}
              </span>
            ))}
          </div>

          {/* Time display area */}
          <div className="lcd-time">
            <div className="lcd-digits">
              <SegmentDigit digit={h[0]} />
              <SegmentDigit digit={h[1]} />
              <LcdColon blink={!showSeconds} />
              <SegmentDigit digit={m[0]} />
              <SegmentDigit digit={m[1]} />
              {showSeconds && (
                <>
                  <LcdColon />
                  <SegmentDigit digit={s[0]} />
                  <SegmentDigit digit={s[1]} />
                </>
              )}
            </div>

            {use12Hour && <span className="lcd-ampm">{ampm}</span>}
          </div>
        </div>
        <div className="lcd-info">
          <div className="lcd-date">{dateString}</div>
          {showWeather && weather?.current && (
            <div className="lcd-weather">
              <span className="material-icons lcd-weather-icon">{weather.current.icon}</span>
              <span className="lcd-weather-temp">
                {Math.round(weather.current.temperature)}
                {weather.units.tempUnit}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

DigitalClock.propTypes = {
  showSeconds: PropTypes.bool,
  use12Hour: PropTypes.bool,
  showWeather: PropTypes.bool,
};

export default DigitalClock;
