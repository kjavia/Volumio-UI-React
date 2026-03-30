import { useRef, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import './marquee.scss';

/**
 * Renders text with a continuous scroll animation only when it overflows its
 * container. Uses the Web Animations API (WAAPI) — not CSS animations — so
 * that layout reflows (e.g. the seekbar updating every second) never restart
 * the animation.
 *
 * @param {string}  children  - Text to display
 * @param {string}  className - Class applied to the outer wrapper
 * @param {number}  speed     - Pixels per second (default 40)
 * @param {string}  gap       - Space between the two copies (default '4em')
 */
const Marquee = memo(({ children, className, speed = 40, gap = '4em' }) => {
  const outerRef = useRef(null);
  const trackRef = useRef(null);
  const copy1Ref = useRef(null);
  const copy2Ref = useRef(null);
  const animRef = useRef(null);
  const prevDist = useRef(0);

  const text = children ?? '';

  useEffect(() => {
    const outer = outerRef.current;
    const track = trackRef.current;
    const copy1 = copy1Ref.current;
    const copy2 = copy2Ref.current;
    if (!outer || !track || !copy1 || !copy2) return;

    const apply = () => {
      const containerWidth = outer.clientWidth;
      if (!containerWidth) return;

      const textWidth = copy1.scrollWidth;
      const overflows = textWidth > containerWidth;

      if (!overflows) {
        if (animRef.current) {
          animRef.current.cancel();
          animRef.current = null;
          prevDist.current = 0;
        }
        // Show static: reset track position, hide second copy
        track.style.transform = '';
        track.style.gap = '0';
        copy2.style.display = 'none';
        return;
      }

      // Reveal second copy and restore gap before measuring/animating
      copy2.style.display = '';
      track.style.gap = '';

      const gapPx = parseFloat(getComputedStyle(copy1).fontSize) * parseFloat(gap);
      const dist = Math.round(textWidth + gapPx);

      // If already animating the same distance, leave it running
      if (dist === prevDist.current && animRef.current?.playState === 'running') return;
      prevDist.current = dist;

      if (animRef.current) animRef.current.cancel();

      animRef.current = track.animate(
        [{ transform: 'translateX(0px)' }, { transform: `translateX(${-dist}px)` }],
        { duration: Math.round((dist / speed) * 1000), iterations: Infinity, easing: 'linear' },
      );
    };

    // Hide second copy on first mount until we know it overflows
    copy2.style.display = 'none';

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(outer);
    return () => {
      ro.disconnect();
      if (animRef.current) { animRef.current.cancel(); animRef.current = null; }
      prevDist.current = 0;
    };
  }, [text, speed, gap]);

  return (
    <div ref={outerRef} className={`marquee-outer${className ? ` ${className}` : ''}`}>
      <span ref={trackRef} className="marquee-track" style={{ '--marquee-gap': gap }}>
        <span ref={copy1Ref} className="marquee-copy">{text}</span>
        <span ref={copy2Ref} className="marquee-copy" aria-hidden="true">{text}</span>
      </span>
    </div>
  );
});

Marquee.displayName = 'Marquee';

Marquee.propTypes = {
  children: PropTypes.string,
  className: PropTypes.string,
  speed: PropTypes.number,
  gap: PropTypes.string,
};

export default Marquee;
