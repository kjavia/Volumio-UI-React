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
  const loopRef = useRef(null);
  const prevDims = useRef({ textWidth: 0, containerWidth: 0, gapPx: 0 });

  const text = children ?? '';

  useEffect(() => {
    const outer = outerRef.current;
    const track = trackRef.current;
    const copy1 = copy1Ref.current;
    const copy2 = copy2Ref.current;
    if (!outer || !track || !copy1 || !copy2) return;

    const cancelAll = () => {
      if (loopRef.current) { loopRef.current.cancel(); loopRef.current = null; }
    };

    const apply = () => {
      const containerWidth = outer.clientWidth;
      if (!containerWidth) return;

      const textWidth = copy1.scrollWidth;
      const overflows = textWidth > containerWidth;

      if (!overflows) {
        cancelAll();
        copy2.style.display = 'none';
        track.style.transform = '';
        outer.removeAttribute('data-scrolling');
        return;
      }

      copy2.style.display = '';

      const style = getComputedStyle(track);
      const gapPx = parseFloat(style.columnGap || style.gap || '0') || 0;

      // Already looping with the same dimensions — leave it running.
      const prev = prevDims.current;
      if (
        loopRef.current?.playState === 'running' &&
        textWidth === prev.textWidth &&
        containerWidth === prev.containerWidth &&
        gapPx === prev.gapPx
      ) return;

      cancelAll();
      prevDims.current = { textWidth, containerWidth, gapPx };

      // Force left-start so translateX(0) == left edge regardless of align prop.
      outer.setAttribute('data-scrolling', '');

      // Seamless two-copy loop:
      // - Start at 0 so the left copy completes naturally.
      // - End at -(text+gap) so copy2 shifts into copy1's start position.
      // This lets the right copy enter before the left one fully exits.
      const cycleDist = textWidth + gapPx;
      loopRef.current = track.animate(
        [{ transform: 'translateX(0px)' }, { transform: `translateX(${-cycleDist}px)` }],
        { duration: Math.round((cycleDist / speed) * 1000), iterations: Infinity, easing: 'linear' },
      );
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(outer);

    return () => {
      ro.disconnect();
      cancelAll();
      prevDims.current = { textWidth: 0, containerWidth: 0, gapPx: 0 };
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
