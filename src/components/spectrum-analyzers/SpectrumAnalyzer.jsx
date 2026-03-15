import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AudioMotionAnalyzer from 'audiomotion-analyzer';

// MediaElementSourceNode can only be created ONCE per HTMLMediaElement.
// Cache { ctx, sourceNode } in a WeakMap so remounts reuse the same pair.
const mediaSourceCache = new WeakMap();

const MODES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10]; // Discrete to Octaves to Line

const SpectrumAnalyzer = ({ streamUrl, gradient = 'prism', initialMode = 2 }) => {
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const analyzerRef = useRef(null);
  const touchTimer = useRef(null);
  const [enabled, setEnabled] = useState(false);
  // Initialize mode from prop (renamed to initialMode to clarify it's internal state now)
  const [currentMode, setCurrentMode] = useState(initialMode);

  // Update mode on the analyzer instance when state changes
  useEffect(() => {
    if (analyzerRef.current) {
      analyzerRef.current.mode = currentMode;
    }
  }, [currentMode]);

  const cycleMode = () => {
    setCurrentMode((prev) => {
      // Find current index to cycle properly even if prop changed
      // But we are using internal state, so just find index in MODES array
      const currentIdx = MODES.indexOf(prev);
      // If current mode not in list (e.g. from props), default to 0
      const idx = currentIdx === -1 ? 0 : currentIdx;
      const nextIdx = (idx + 1) % MODES.length;
      return MODES[nextIdx];
    });
  };

  const handleTouchStart = () => {
    // Only cycle if enabled
    if (!enabled) return;

    // Clear any existing timer just in case
    if (touchTimer.current) clearTimeout(touchTimer.current);

    touchTimer.current = setTimeout(() => {
      cycleMode();
    }, 800); // 800ms long press
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  };

  const handleEnable = () => {
    if (enabled) return;

    const audio = audioRef.current;
    const container = containerRef.current;
    if (!audio || !container) return;

    // Do NOT mute the audio element itself, or the MediaElementSourceNode will
    // output silence (zeroes) to the analyzer.
    audio.muted = false;

    let entry = mediaSourceCache.get(audio);
    if (!entry) {
      const ctx = new AudioContext();
      const sourceNode = ctx.createMediaElementSource(audio);
      entry = { ctx, sourceNode };
      mediaSourceCache.set(audio, entry);
    } else {
      if (entry.ctx.state === 'suspended') {
        entry.ctx.resume();
      }
    }

    const { ctx, sourceNode } = entry;

    if (!analyzerRef.current) {
      try {
        analyzerRef.current = new AudioMotionAnalyzer(container, {
          audioCtx: ctx,
          source: sourceNode,
          connectSpeakers: false,
          gradient,
          mode: currentMode, // use state value
          frequencyScale: 'log',
          showScaleX: false,
          showBgColor: true,
          bgAlpha: 1,
          smoothing: 0.8,
          reflexRatio: 0.3,
          reflexAlpha: 0.4,
          reflexFit: true,
        });
      } catch (e) {
        console.warn('SpectrumAnalyzer: failed to initialize', e);
        return;
      }
    }

    audio.play().catch(() => {});
    setEnabled(true);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '120px',
        position: 'relative',
        cursor: 'pointer',
        userSelect: 'none',
        touchAction: 'none', // Prevent scrolling while holding
      }}
      onClick={handleEnable}
      onDoubleClick={() => {
        if (enabled) cycleMode();
      }}
      // Touch/Mouse handlers for Long Press
      onTouchStart={() => {
        // If not enabled, the onClick above will handle enabling
        // But we want to ensure we don't block that click
        // For long press, we only care if already enabled
        if (enabled) handleTouchStart();
      }}
      onTouchEnd={handleTouchEnd}
      // Mouse down/up also triggers long press for desktop click-and-hold
      onMouseDown={() => {
        if (enabled) handleTouchStart();
      }}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '120px' }} />

      {!enabled && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'rgba(0,0,0,0.55)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.78rem',
            letterSpacing: '0.05em',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          <span className="material-icons" style={{ fontSize: '1.4rem', opacity: 0.7 }}>
            graphic_eq
          </span>
          Click to enable visualization
        </div>
      )}

      <audio
        ref={audioRef}
        src={streamUrl}
        crossOrigin="anonymous"
        preload="none"
        style={{ display: 'none' }}
      />
    </div>
  );
};

SpectrumAnalyzer.propTypes = {
  streamUrl: PropTypes.string.isRequired,
  gradient: PropTypes.string,
  initialMode: PropTypes.number,
};

export default SpectrumAnalyzer;
