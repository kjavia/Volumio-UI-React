import { useState, useEffect, useRef, memo } from 'react';
import PropTypes from 'prop-types';
// @pqina/flip is loaded as a global UMD script in index.html.
// It sets window.Tick (with the Flip view already registered).
// This sidesteps Vite/esbuild's typeof-window evaluation issue in the module build.
import useWeather from '@/hooks/useWeather';
import './flip-clock.scss';

/**
 * FlipDigit — one character backed by a single window.Tick instance.
 *
 * The Tick container and span are created via document.createElement so they
 * are NOT part of React's VDOM.  This prevents React 18 StrictMode from
 * detaching the elements when it runs cleanup+remount (which would make Tick
 * render into an invisible detached node).
 */
const FlipDigit = memo(({ digit }) => {
  const wrapperRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const Tick = window.Tick;
    if (!wrapper || !Tick || !Tick.DOM) return;

    // Build the Tick DOM tree outside React's control.
    const container = document.createElement('div');
    const span = document.createElement('span');
    span.setAttribute('data-view', 'flip');
    container.appendChild(span);
    wrapper.appendChild(container);

    const instance = Tick.DOM.create(container);
    instance.value = digit;
    tickRef.current = instance;

    return () => {
      tickRef.current = null;
      // Manually detach before calling destroy so that Tick's internal
      // removeChild is a no-op (parentNode will already be null).
      if (container.parentNode) container.parentNode.removeChild(container);
      Tick.DOM.destroy(container);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tickRef.current) tickRef.current.value = digit;
  }, [digit]);

  return <div ref={wrapperRef} />;
});

FlipDigit.displayName = 'FlipDigit';
FlipDigit.propTypes = { digit: PropTypes.string.isRequired };

/** Two-digit panel (hours / minutes / seconds). */
const FlipPanel = memo(({ value }) => {
  const str = String(value).padStart(2, '0');
  return (
    <div className="flip-panel">
      <FlipDigit digit={str[0]} />
      <FlipDigit digit={str[1]} />
    </div>
  );
});

FlipPanel.displayName = 'FlipPanel';
FlipPanel.propTypes = { value: PropTypes.number.isRequired };

const FlipClock = ({ showSeconds = true, showWeather = false }) => {
  const { data: weather } = useWeather();
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

  const hours24 = time.getHours();
  const hours = hours24 % 12 || 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const ampm = hours24 >= 12 ? 'PM' : 'AM';

  const dateString = time.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flip-clock">
      <div className="flip-clock-body">
        <FlipPanel value={hours} />
        <span className="flip-colon">:</span>
        <FlipPanel value={minutes} />
        {showSeconds && (
          <>
            <span className="flip-colon">:</span>
            <FlipPanel value={seconds} />
          </>
        )}
        <span className="flip-ampm">{ampm}</span>

        <div className="flip-clock-stand">
          <span className="flip-clock-date">{dateString}</span>
          {showWeather && weather?.current && (
            <span className="flip-clock-weather">
              <span className="material-icons flip-clock-weather-icon">
                {weather.current.icon}
              </span>
              {Math.round(weather.current.temperature)}
              {weather.units.tempUnit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

FlipClock.propTypes = {
  showSeconds: PropTypes.bool,
  showWeather: PropTypes.bool,
};

export default FlipClock;
