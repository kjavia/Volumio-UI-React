import { useState, useEffect } from 'react';
import './analog-clock.scss';

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const AnalogClock = ({ showSeconds = true }) => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    let intervalId;
    const tick = () => setTime(new Date());
    const msToNextSecond = 1000 - new Date().getMilliseconds();
    const syncTimeout = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, 1000);
    }, msToNextSecond);
    return () => {
      clearTimeout(syncTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  const dayName = time.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
  const dateStr = time.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="analog-clock-wrapper">
      <div className="analog-clock">
        {/* Outer bezel ring */}
        <div className="clock-bezel">
          <div className="clock-face">
            {/* Minute markings (60 ticks) */}
            {Array.from({ length: 60 }, (_, i) => (
              <div
                key={`tick-${i}`}
                className={`clock-tick ${i % 5 === 0 ? 'clock-tick--hour' : 'clock-tick--minute'}`}
                style={{ transform: `rotate(${i * 6}deg)` }}
              />
            ))}

            {/* Hour digits */}
            {HOURS.map((h, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const radius = 40; // % from center
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);
              return (
                <span key={h} className="clock-hour-digit" style={{ left: `${x}%`, top: `${y}%` }}>
                  {h}
                </span>
              );
            })}

            {/* Day & date on the face */}
            <div className="clock-face-info">
              <span className="clock-face-day">{dayName}</span>
              <span className="clock-face-date">{dateStr}</span>
            </div>

            {/* Hands */}
            <div
              className="clock-hand clock-hand--hour"
              style={{ transform: `rotate(${hourDeg}deg)` }}
            />
            <div
              className="clock-hand clock-hand--minute"
              style={{ transform: `rotate(${minuteDeg}deg)` }}
            />
            {showSeconds && (
              <div
                className="clock-hand clock-hand--second"
                style={{ transform: `rotate(${secondDeg}deg)` }}
              />
            )}

            {/* Center cap */}
            <div className="clock-center" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalogClock;
