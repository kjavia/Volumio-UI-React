import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './marquee.scss';

/**
 * Renders text with a continuous scroll animation only when it overflows its
 * container. Uses two copies side-by-side so the loop is seamless.
 *
 * @param {string}  children  - Text to display
 * @param {string}  className - Class applied to the outer wrapper
 * @param {number}  speed     - Pixels per second (default 40)
 * @param {string}  gap       - Space between the two copies (default '4em')
 */
const Marquee = ({ children, className, speed = 40, gap = '4em' }) => {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [overflows, setOverflows] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const measure = () => {
      // innerRef holds one copy; if it's wider than the outer it overflows
      const textWidth = inner.scrollWidth;
      const containerWidth = outer.clientWidth;
      const doesOverflow = textWidth > containerWidth;
      setOverflows(doesOverflow);
      if (doesOverflow) {
        // Duration = (text + gap) / speed. Gap is in em so we read it in px.
        const gapPx = parseFloat(getComputedStyle(inner).fontSize) * parseFloat(gap);
        setDuration((textWidth + gapPx) / speed);
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [children, speed, gap]);

  const text = children ?? '';

  return (
    <div ref={outerRef} className={`marquee-outer${className ? ` ${className}` : ''}`}>
      {overflows ? (
        <span
          className="marquee-track"
          style={{ '--marquee-duration': `${duration}s`, '--marquee-gap': gap }}
        >
          <span ref={innerRef} className="marquee-copy">{text}</span>
          <span className="marquee-copy" aria-hidden="true">{text}</span>
        </span>
      ) : (
        <span ref={innerRef} className="marquee-static">{text}</span>
      )}
    </div>
  );
};

Marquee.propTypes = {
  children: PropTypes.string,
  className: PropTypes.string,
  speed: PropTypes.number,
  gap: PropTypes.string,
};

export default Marquee;
