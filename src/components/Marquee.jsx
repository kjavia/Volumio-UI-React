import { useRef, useEffect, memo } from 'react';
import './marquee.scss';

/**
 * Renders text with a scroll animation only when it overflows its container.
 * Uses the Web Animations API (WAAPI) so layout reflows never restart the animation.
 *
 * Scroll behaviour:
 *   Phase 1 — initial run: scrolls the visible text off to the left (once).
 *   Phase 2+ — every repeat: text enters from the right edge and scrolls left.
 *
 * This is consistent regardless of the `align` prop.
 *
 * @param {string}  children  - Text to display
 * @param {string}  className - Class applied to the outer wrapper
 * @param {number}  speed     - Pixels per second (default 40)
 * @param {string}  align     - 'left' | 'center' | 'right' (static display only)
 */
const Marquee = memo(({ children, className, speed = 40, gap = '4em', align = 'center' }) => {
  const outerRef = useRef(null);
  const trackRef = useRef(null);
  const copy1Ref = useRef(null);
  const copy2Ref = useRef(null);
  const loopRef = useRef(null);   // phase-2 looping animation
  const phase1Ref = useRef(null);   // phase-1 one-shot animation
  const prevDims = useRef({ textWidth: 0, containerWidth: 0 });

  const text = children ?? '';

  useEffect(() => {
    const outer = outerRef.current;
    const track = trackRef.current;
    const copy1 = copy1Ref.current;
    const copy2 = copy2Ref.current;
    if (!outer || !track || !copy1 || !copy2) return;

    const cancelAll = () => {
      if (loopRef.current) { loopRef.current.cancel(); loopRef.current = null; }
      if (phase1Ref.current) { phase1Ref.current.cancel(); phase1Ref.current = null; }
    };

    const apply = () => {
      const containerWidth = outer.clientWidth;
      if (!containerWidth) return;

      const textWidth = copy1.scrollWidth;
      const overflows = textWidth > containerWidth;

      if (!overflows) {
        cancelAll();
        track.style.transform = '';
        outer.removeAttribute('data-scrolling');
        return;
      }

      // Already looping with the same dimensions — leave it running.
      const prev = prevDims.current;
      if (
        loopRef.current?.playState === 'running' &&
        textWidth === prev.textWidth &&
        containerWidth === prev.containerWidth
      ) return;

      cancelAll();
      prevDims.current = { textWidth, containerWidth };

      // Force left-start so translateX(0) == left edge regardless of align prop.
      outer.setAttribute('data-scrolling', '');

      const startLoop = () => {
        const fullDist = containerWidth + textWidth;
        loopRef.current = track.animate(
          [
            { transform: `translateX(${containerWidth}px)` },
            { transform: `translateX(${-textWidth}px)` },
          ],
          { duration: Math.round((fullDist / speed) * 1000), iterations: Infinity, easing: 'linear' },
        );
      };

      // Phase 1: scroll the already-visible text off to the left, then hand off.
      const p1 = track.animate(
        [{ transform: 'translateX(0px)' }, { transform: `translateX(${-textWidth}px)` }],
        { duration: Math.round((textWidth / speed) * 1000), iterations: 1, easing: 'linear', fill: 'forwards' },
      );
      phase1Ref.current = p1;

      p1.addEventListener('finish', () => {
        if (phase1Ref.current !== p1) return; // superseded by a newer call
        phase1Ref.current = null;
        p1.cancel(); // remove fill effect so the loop animation is unambiguous
        startLoop();
      });
    };

    copy2.style.display = 'none';
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(outer);

    return () => {
      ro.disconnect();
      cancelAll();
      prevDims.current = { textWidth: 0, containerWidth: 0 };
    };
  }, [text, speed]);

  const justifyContent = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  return (
    <div
      ref={outerRef}
      className={`marquee-outer${className ? ` ${className}` : ''}`}
      style={{ textAlign: align, justifyContent }}
    >
      <span ref={trackRef} className="marquee-track" style={{ '--marquee-gap': gap }}>
        <span ref={copy1Ref} className="marquee-copy">{text}</span>
        <span ref={copy2Ref} className="marquee-copy" aria-hidden="true">{text}</span>
      </span>
    </div>
  );
});

Marquee.displayName = 'Marquee';

export default Marquee;
