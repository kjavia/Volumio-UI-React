import { useState, useEffect, useRef } from 'react';
import './flip-clock.scss';

const FlipDigit = ({ digit }) => {
  const [flipping, setFlipping] = useState(false);
  const [prevDigit, setPrevDigit] = useState(digit);
  const [bottomDigit, setBottomDigit] = useState(digit);
  const currentRef = useRef(digit);

  useEffect(() => {
    if (digit !== currentRef.current) {
      setPrevDigit(currentRef.current);
      currentRef.current = digit;
      setFlipping(true);

      const timer = setTimeout(() => {
        setBottomDigit(digit);
        setFlipping(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [digit]);

  return (
    <div className="flip-digit">
      {/* Static top — shows new value (revealed when front flips away) */}
      <div className="flip-digit-top">{digit}</div>

      {/* Static bottom — shows old value, updates after flip completes */}
      <div className="flip-digit-bottom">{bottomDigit}</div>

      {/* Center divider line */}
      <div className="flip-digit-line" />

      {/* 3D flipping card: single element rotating -180deg */}
      {flipping && (
        <div className="flip-card" key={digit}>
          {/* Front face: top half showing old digit */}
          <div className="flip-card-front">{prevDigit}</div>
          {/* Back face: bottom half showing new digit (pre-rotated 180deg) */}
          <div className="flip-card-back">{digit}</div>
        </div>
      )}
    </div>
  );
};

const FlipPanel = ({ value }) => {
  const str = String(value).padStart(2, '0');
  return (
    <div className="flip-panel">
      <FlipDigit digit={str[0]} />
      <FlipDigit digit={str[1]} />
    </div>
  );
};

const FlipClock = ({ showSeconds = true }) => {
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
  const isPM = hours24 >= 12;
  const hours = hours24 % 12 || 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const ampm = isPM ? 'PM' : 'AM';

  const dateString = time.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flip-clock">
      {/* Clock body */}
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

        {/* Stand / Footer */}
        <div className="flip-clock-stand">
          <span className="flip-clock-date">{dateString}</span>
        </div>
      </div>
    </div>
  );
};

export default FlipClock;
