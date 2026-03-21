import { useRef, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './VUMeter.scss';

// MediaElementSourceNode can only be created ONCE per HTMLMediaElement.
// Cache it at module level so remounts reuse the same node.
const mediaSourceCache = new WeakMap();

const MIN_DB = -20;
const MAX_DB = 5;

// Full sweep angles at -20 dB and +5 dB
const NEEDLE_MIN_ANGLE = -43; // degrees (far left / silence)
const NEEDLE_MAX_ANGLE = 43;  // degrees (far right / peak)

const FFT_SIZE = 1024;

/** Map a dB value to a CSS rotation angle. */
const dbToAngle = (db) => {
  const clamped = Math.max(MIN_DB, Math.min(MAX_DB, db));
  return (
    NEEDLE_MIN_ANGLE +
    ((clamped - MIN_DB) / (MAX_DB - MIN_DB)) * (NEEDLE_MAX_ANGLE - NEEDLE_MIN_ANGLE)
  );
};

/** Calculate the RMS level from a Uint8Array of time-domain samples (0–255). */
const calcRms = (data) => {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const s = (data[i] - 128) / 128; // normalize to -1..1
    sum += s * s;
  }
  return Math.sqrt(sum / data.length);
};

const rmsToDb = (rms) => (rms < 0.00001 ? -100 : 20 * Math.log10(rms));

/**
 * VUMeter
 *
 * Renders a dual-channel (L+R) VU meter using the provided stream URL.
 * Pass `variant` (1, 2, …) to select which background image and tuning-knob
 * overrides to use.  Each variant maps to a `.vu-meter--variant-N` CSS class
 * whose `--left-pivot-x` / `--right-pivot-x` / `--pivot-bottom` / `--needle-height`
 * custom properties can be set independently in VUMeter.scss.
 *
 * Pass `backgroundSrc` to override the image for a specific variant, or rely
 * on the default path `/assets/images/vu-meters/vu-meter-{variant}.jpg`.
 */
/** Default needle colour per variant: black for 1 & 2, white for 3+. */
const defaultNeedleColor = (v) => (v >= 3 ? '#f0f0f0' : '#0d0d0d');

const VUMeter = ({ streamUrl, variant = 1, backgroundSrc, needleColor, stopped = false, onResumed }) => {
  const resolvedNeedleColor = needleColor ?? defaultNeedleColor(variant);
  const audioRef = useRef(null);
  const displayRef = useRef(null);
  const bgRef = useRef(null);
  const needleLRef = useRef(null);
  const needleRRef = useRef(null);
  const analyserLRef = useRef(null);
  const analyserRRef = useRef(null);
  const animFrameRef = useRef(null);
  const smoothedRef = useRef({ left: MIN_DB, right: MIN_DB });
  const [enabled, setEnabled] = useState(false);

  // --------------------------------------------------------------------------
  // Audio setup
  // --------------------------------------------------------------------------
  const setupAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Keep the element unmuted so the Web Audio API receives decoded samples.
    // (We do NOT connect to ctx.destination, so nothing plays through the
    //  browser speaker — Volumio handles output on the device itself.)
    audio.muted = false;

    let entry = mediaSourceCache.get(audio);
    if (!entry) {
      const ctx = new AudioContext();
      const sourceNode = ctx.createMediaElementSource(audio);
      entry = { ctx, sourceNode };
      mediaSourceCache.set(audio, entry);
    }

    // iOS requires AudioContext.resume() synchronously within the user gesture.
    // A newly created AudioContext starts suspended on iOS/Safari.
    if (entry.ctx.state === 'suspended') {
      entry.ctx.resume();
    }

    const { ctx, sourceNode } = entry;

    if (!analyserLRef.current) {
      const analyserL = ctx.createAnalyser();
      const analyserR = ctx.createAnalyser();

      analyserL.fftSize = FFT_SIZE;
      analyserR.fftSize = FFT_SIZE;
      analyserL.smoothingTimeConstant = 0;
      analyserR.smoothingTimeConstant = 0;

      // ---- Stereo note ----------------------------------------------------
      // createChannelSplitter() cannot be used reliably here because
      // sourceNode.channelCount reports the WebAudio default (2) *before* the
      // stream is decoded, not the actual channel count of the media.  For a
      // mono stream this means splitter output 1 is always silent and the
      // right needle never moves.
      //
      // Instead we connect the source directly to both analysers.  Each
      // AnalyserNode down-mixes its input to mono before producing time-domain
      // data, so:
      //   • Mono stream  → both needles track the same mono level ✓
      //   • Stereo stream → both needles track L+R mixed level ✓
      //
      // True per-channel stereo requires an AudioWorklet (out of scope here).
      // -------------------------------------------------------------------
      sourceNode.connect(analyserL);
      sourceNode.connect(analyserR);
      // NOT connected to ctx.destination — Volumio plays audio on the device.

      analyserLRef.current = analyserL;
      analyserRRef.current = analyserR;
    }

    audio.play().catch(() => {});
  }, []);

  // --------------------------------------------------------------------------
  // Animation loop — runs every rAF, updates needle DOM directly (no setState)
  // --------------------------------------------------------------------------
  const startAnimation = useCallback(() => {
    // VU meter ballistics:
    //   • ATTACK  ≈ fast  (needle rises quickly)
    //   • RELEASE ≈ slow  (needle falls lazily)
    const ATTACK = 0.35;
    const RELEASE = 0.07;

    const dataL = new Uint8Array(FFT_SIZE);
    const dataR = new Uint8Array(FFT_SIZE);

    const tick = () => {
      animFrameRef.current = requestAnimationFrame(tick);
      if (!analyserLRef.current || !analyserRRef.current) return;

      analyserLRef.current.getByteTimeDomainData(dataL);
      analyserRRef.current.getByteTimeDomainData(dataR);

      const rawL = rmsToDb(calcRms(dataL));
      const rawR = rmsToDb(calcRms(dataR));

      const s = smoothedRef.current;
      s.left += (rawL - s.left) * (rawL > s.left ? ATTACK : RELEASE);
      s.right += (rawR - s.right) * (rawR > s.right ? ATTACK : RELEASE);

      // Write directly to DOM — avoids React re-render overhead at 60 fps
      if (needleLRef.current)
        needleLRef.current.style.transform = `rotate(${dbToAngle(s.left)}deg)`;
      if (needleRRef.current)
        needleRRef.current.style.transform = `rotate(${dbToAngle(s.right)}deg)`;
    };

    tick();
  }, []);

  // --------------------------------------------------------------------------
  // Needle positioning — recalculate whenever container resizes or image loads.
  // The SCSS tuning knobs (--left-pivot-x etc.) are image-relative percentages.
  // This converts them into container-relative px values so the needles line up
  // correctly even when the image is letterboxed / pillarboxed by object-fit.
  // --------------------------------------------------------------------------
  const recalcNeedles = useCallback(() => {
    const display = displayRef.current;
    const img = bgRef.current;
    if (!display || !img || !img.naturalWidth) return;

    const cW = display.clientWidth;
    const cH = display.clientHeight;
    if (!cW || !cH) return;

    // Compute the rendered image bounds under object-fit: contain
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = cW / cH;
    let imgW, imgH, imgLeft, imgTop;
    if (containerRatio > imgRatio) {
      // Pillarboxed — height fills, blank bars left+right
      imgH = cH;
      imgW = imgH * imgRatio;
      imgLeft = (cW - imgW) / 2;
      imgTop = 0;
    } else {
      // Letterboxed — width fills, blank bars top+bottom
      imgW = cW;
      imgH = imgW / imgRatio;
      imgLeft = 0;
      imgTop = (cH - imgH) / 2;
    }

    // Read logical tuning values from CSS custom properties
    const root = display.closest('.vu-meter') || display;
    const cs = getComputedStyle(root);
    const pct = (v) => parseFloat(v) / 100;
    const pivotXL  = pct(cs.getPropertyValue('--left-pivot-x'));
    const pivotXR  = pct(cs.getPropertyValue('--right-pivot-x'));
    const pivotBot = pct(cs.getPropertyValue('--pivot-bottom'));
    const needleH  = pct(cs.getPropertyValue('--needle-height'));

    // Map image-relative percentages → container-absolute px
    const lx        = imgLeft + pivotXL * imgW;
    const rx        = imgLeft + pivotXR * imgW;
    // `bottom` CSS = distance from container bottom to the pivot point
    const bottomPx  = cH - imgTop - imgH * (1 - pivotBot);
    const heightPx  = needleH * imgH;

    display.style.setProperty('--needle-L-left',  `${lx}px`);
    display.style.setProperty('--needle-R-left',  `${rx}px`);
    display.style.setProperty('--needle-bottom',  `${bottomPx}px`);
    display.style.setProperty('--needle-h',       `${heightPx}px`);
  }, []);

  const handleEnable = useCallback(() => {
    if (enabled) return;
    setupAudio();
    startAnimation();
    onResumed?.();
    setEnabled(true);
  }, [enabled, setupAudio, startAnimation, onResumed]);

  // Stop animation when the stopped prop goes true
  useEffect(() => {
    if (stopped && enabled) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      audioRef.current?.pause();
      // Reset smoothed ballistics so stale values don't leak into the next session
      smoothedRef.current = { left: MIN_DB, right: MIN_DB };
      const initAngle = dbToAngle(MIN_DB);
      if (needleLRef.current)
        needleLRef.current.style.transform = `rotate(${initAngle}deg)`;
      if (needleRRef.current)
        needleRRef.current.style.transform = `rotate(${initAngle}deg)`;
      setEnabled(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopped]);

  // Initialise needles to full-left on mount; cancel rAF on unmount
  useEffect(() => {
    const initAngle = dbToAngle(MIN_DB);
    if (needleLRef.current)
      needleLRef.current.style.transform = `rotate(${initAngle}deg)`;
    if (needleRRef.current)
      needleRRef.current.style.transform = `rotate(${initAngle}deg)`;

    // Recalculate needle positions on container resize
    const observer = new ResizeObserver(recalcNeedles);
    if (displayRef.current) observer.observe(displayRef.current);

    // Handle image already cached (naturalWidth set before onLoad fires)
    if (bgRef.current?.naturalWidth) recalcNeedles();

    return () => {
      observer.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [recalcNeedles]);

  const variantClass = `vu-meter--variant-${variant}`;
  const imgSrc = backgroundSrc || `/assets/images/vu-meters/vu-meter-${variant}.jpg`;

  return (
    <div
      className={`vu-meter ${variantClass}${enabled ? ' vu-meter--enabled' : ''}`}
      style={{ '--needle-color': resolvedNeedleColor }}
      onClick={handleEnable}
      title={enabled ? undefined : 'Click to enable VU meter'}
    >
      <div ref={displayRef} className="vu-meter__display">
        {/* Background image — both meter faces */}
        <img
          ref={bgRef}
          src={imgSrc}
          alt={`VU Meter ${variant}`}
          className="vu-meter__bg"
          draggable="false"
          onLoad={recalcNeedles}
        />

        {/* Left channel needle */}
        <div ref={needleLRef} className="vu-meter__needle vu-meter__needle--left" />

        {/* Right channel needle */}
        <div ref={needleRRef} className="vu-meter__needle vu-meter__needle--right" />
      </div>

      {!enabled && (
        <div className="vu-meter__prompt">
          <span className="material-icons">graphic_eq</span>
          <span>Click to enable</span>
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

VUMeter.propTypes = {
  /** URL of the Volumio audio stream (e.g. SPECTRUM_STREAM_URL). */
  streamUrl: PropTypes.string.isRequired,
  /** Which background variant to use (1, 2, …). Defaults to 1. */
  variant: PropTypes.number,
  /** Override the background image URL. Falls back to /assets/images/vu-meters/vu-meter-{variant}.jpg */
  backgroundSrc: PropTypes.string,
  /**
   * Needle colour (any CSS colour string, e.g. '#fff', 'black', 'rgba(…)').
   * Defaults to black for variants 1 & 2, white for variant 3+.
   * Overrides the per-variant SCSS default when explicitly provided.
   */
  needleColor: PropTypes.string,
};

export default VUMeter;
