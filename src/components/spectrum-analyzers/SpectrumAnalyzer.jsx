import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import AudioMotionAnalyzer from 'audiomotion-analyzer';

// MediaElementSourceNode can only be created ONCE per HTMLMediaElement.
// Cache { ctx, sourceNode } in a WeakMap so remounts reuse the same pair.
const mediaSourceCache = new WeakMap();

const MODES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10]; // Discrete to Octaves to Line

const SpectrumAnalyzer = forwardRef(({ streamUrl, gradient = 'prism', initialMode = 2, stopped = false, onResumed, options = null, isPlaying = false }, ref) => {
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const analyzerRef = useRef(null);
  const touchTimer = useRef(null);
  const retryTimer = useRef(null);
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

  const handleStreamError = () => {
    if (!enabled) return;

    if (retryTimer.current) clearTimeout(retryTimer.current);

    console.log('Stream disconnected, retrying in 1s...');
    retryTimer.current = setTimeout(() => {
      if (!enabled) return;

      const audio = audioRef.current;
      if (audio) {
        // Append timestamp to force reload
        const separator = streamUrl.includes('?') ? '&' : '?';
        audio.src = `${streamUrl}${separator}t=${Date.now()}`;
        audio.load();
        audio.play().catch((e) => console.warn('Retry failed', e));
      }
    }, 1000);
  };

  const handleEnable = () => {
    if (enabled) return;

    const audio = audioRef.current;
    const container = containerRef.current;
    if (!audio || !container) return;

    // Bail if the container has no layout yet — AudioMotionAnalyzer will throw
    // if the container dimensions are zero, leaving analyzerRef null and the
    // viz permanently broken.
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.warn('SpectrumAnalyzer: container has no dimensions yet, skipping enable');
      return;
    }

    audio.muted = false;

    let entry = mediaSourceCache.get(audio);
    if (!entry) {
      // Use sinkId:{type:'none'} so Chromium never opens the ALSA hardware
      // output device for this context.  On the Volumio kiosk (Chromium ≥108
      // without PulseAudio), creating a normal AudioContext grabs the ALSA
      // device before MPD can open it, causing "Device or resource busy".
      // Older browsers silently ignore the unknown sinkId option.
      const ctx = new AudioContext({ sampleRate: 44100, sinkId: { type: 'none' } });
      const sourceNode = ctx.createMediaElementSource(audio);
      entry = { ctx, sourceNode };
      mediaSourceCache.set(audio, entry);
    }

    // Resume synchronously within the user gesture on iOS/Safari.
    if (entry.ctx.state === 'suspended') {
      entry.ctx.resume();
    }

    const { ctx, sourceNode } = entry;

    // Delay the actual stream connection by 1 second so ALSA/Volumio finishes
    // opening the audio device before FFmpeg tries to read the FIFO.
    // AudioContext setup above must stay synchronous (user-gesture window),
    // but the HTTP stream request can be deferred safely.
    const doPlay = () => {
      audio.play().catch(() => { });
      onResumed?.();
    };
    setTimeout(doPlay, 1000);

    if (!analyzerRef.current) {
      try {
        const defaultOptions = {
          gradient,
          mode: currentMode,
          frequencyScale: 'log',
          outlineBars: true,
          barSpace: 0.2,
          ledBars: true,
          ansiBands: true,
          showScaleX: true,
          showBgColor: false,
          smoothing: 0.8,
          reflexRatio: 0.3,
          reflexAlpha: 0.4,
          reflexFit: true,
        };
        // Coerce any string numeric values in user options (config JSON may have them)
        const coerced = options
          ? Object.fromEntries(
            Object.entries(options).map(([k, v]) => [k, typeof v === 'string' && !isNaN(v) ? Number(v) : v])
          )
          : null;
        analyzerRef.current = new AudioMotionAnalyzer(container, {
          audioCtx: ctx,
          source: sourceNode,
          connectSpeakers: false,
          ...defaultOptions,
          ...(coerced || {}),
          // Always force transparent canvas — the album art behind the viz
          // acts as the background; the analyzer's own bg must be invisible.
          // overlay:true is required by AudioMotionAnalyzer to make the canvas
          // transparent; without it the canvas fills with a solid black bg.
          showBgColor: false,
          bgAlpha: 0,
          overlay: true,
        });
      } catch (e) {
        // Analyzer failed to initialize but audio is already playing — mark
        // enabled so the overlay hides and the user sees the bare album art.
        console.warn('SpectrumAnalyzer: failed to initialize', e);
        setEnabled(true);
        return;
      }
    }

    // If the analyzer already exists (was previously stopped), just restart it
    if (analyzerRef.current) {
      const entry = mediaSourceCache.get(audio);
      // Resume synchronously — iOS won't allow it in a .then() callback
      if (entry?.ctx.state === 'suspended') entry.ctx.resume();
      analyzerRef.current.start?.();
      setEnabled(true);
      return;
    }

    setEnabled(true);
  };

  const handleEnableRef = useRef(null);
  handleEnableRef.current = handleEnable; // always points to the latest closure

  // Expose enable() so parent components can trigger it during a user gesture
  // (e.g. clicking the play/pause button counts as user interaction).
  useImperativeHandle(ref, () => ({
    enable: () => handleEnableRef.current?.(),
  }), []);

  // NOTE: Do NOT call handleEnable from a useEffect reacting to isPlaying.
  // useEffect runs asynchronously after render — outside the browser's
  // user-gesture activation window — which causes "AudioContext not allowed
  // to start". The only valid trigger path is the synchronous click handler
  // in the parent (handlePlayPause → vizRef.current.enable()).

  // Stop animation when the stopped prop goes true
  useEffect(() => {
    if (stopped) {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    }
    if (stopped && enabled) {
      analyzerRef.current?.stop?.();
      audioRef.current?.pause();
      setEnabled(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopped]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
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
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Show prompt whenever music is playing but viz hasn't been enabled yet.
           This covers: (a) page load while already playing, (b) returning to
           the large-screen layout mid-playback. Once the user clicks (or the
           play button triggers a user-gesture enable), the overlay disappears. */}
      {!enabled && isPlaying && (
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
        onEnded={handleStreamError}
        onError={handleStreamError}
      />
    </div>
  );
});

SpectrumAnalyzer.displayName = 'SpectrumAnalyzer';

SpectrumAnalyzer.propTypes = {
  streamUrl: PropTypes.string.isRequired,
  gradient: PropTypes.string,
  initialMode: PropTypes.number,
  stopped: PropTypes.bool,
  onResumed: PropTypes.func,
  options: PropTypes.object,
  isPlaying: PropTypes.bool,
};

export default SpectrumAnalyzer;
