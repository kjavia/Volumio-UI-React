import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { SPECTRUM_STREAM_URL } from '../../config';
import { fetchMeterConfigs } from './parseMeterConfig';
import { loadMeterImages, renderMeterFrame } from './meterRenderer';
import './PeppyMeter.scss';

// MediaElementSourceNode can only be created ONCE per HTMLMediaElement.
// Shared module-level cache to reuse existing source nodes across remounts.
const mediaSourceCache = new WeakMap();

const FFT_SIZE = 1024;
const MIN_DB = -20;
const MAX_DB = 5;
const DB_RANGE = MAX_DB - MIN_DB;

/** RMS from time-domain byte data → dB → 0..1 normalized volume. */
const calcRms = (data) => {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const s = (data[i] - 128) / 128;
    sum += s * s;
  }
  return Math.sqrt(sum / data.length);
};

const rmsToDb = (rms) => (rms < 0.00001 ? -100 : 20 * Math.log10(rms));

const dbToVolume = (db) => Math.max(0, Math.min(1, (db - MIN_DB) / DB_RANGE));

/**
 * PeppyMeter — canvas-based VU/level meter using PeppyMeter-style assets.
 *
 * Reads the audio stream, parses the meters.txt config, composites background →
 * needle/indicator → foreground layers every animation frame on a <canvas>.
 *
 * @param {Object} props
 * @param {number} props.width — native asset pixel width  (e.g. 1280)
 * @param {number} props.height — native asset pixel height (e.g. 400)
 * @param {string} props.folderName — asset folder suffix  (e.g. "Gelo5-BASIC_221")
 * @param {string} props.model — meter section name from meters.txt (e.g. "01G5_Old Accuphase")
 * @param {string} [props.streamUrl] — audio stream URL (defaults to SPECTRUM_STREAM_URL)
 * @param {boolean} [props.stopped] — pause animation & audio
 * @param {string} [props.className] — additional CSS class names
 */
const PeppyMeterDelete = ({
  width,
  height,
  folderName,
  model,
  streamUrl = SPECTRUM_STREAM_URL,
  stopped = false,
  className = '',
}) => {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const analyserLRef = useRef(null);
  const analyserRRef = useRef(null);
  const animFrameRef = useRef(null);
  const smoothedRef = useRef({ left: MIN_DB, right: MIN_DB });
  const retryTimerRef = useRef(null);
  const imagesRef = useRef(null);
  const configRef = useRef(null);

  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState(null);

  // Derived paths
  const assetPath = useMemo(
    () => `/peppy_meter/${width}x${height}-${folderName}`,
    [width, height, folderName],
  );

  // ── Load config + images ────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const configs = await fetchMeterConfigs(`${assetPath}/meters.txt`);
        const cfg = configs[model];
        if (!cfg) {
          setError(`Meter "${model}" not found in meters.txt`);
          return;
        }
        if (cancelled) return;

        const imgs = await loadMeterImages(cfg, assetPath);
        if (cancelled) return;

        configRef.current = cfg;
        imagesRef.current = imgs;
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [assetPath, model]);

  // ── Audio setup ─────────────────────────────────────────────────────────

  const setupAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = false;

    let entry = mediaSourceCache.get(audio);
    if (!entry) {
      const ctx = new AudioContext({ sampleRate: 44100 });
      // Prevent audible playback — Volumio handles device output
      if (ctx.destination?.context?.setSinkId) {
        ctx.setSinkId({ type: 'none' }).catch(() => { });
      }
      const sourceNode = ctx.createMediaElementSource(audio);
      entry = { ctx, sourceNode };
      mediaSourceCache.set(audio, entry);
    }

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

      sourceNode.connect(analyserL);
      sourceNode.connect(analyserR);
      // NOT connected to destination — Volumio plays audio on the device

      analyserLRef.current = analyserL;
      analyserRRef.current = analyserR;
    }

    audio.play().catch((e) => console.warn('[PeppyMeter] play failed:', e));
  }, []);

  // ── Stream error retry ──────────────────────────────────────────────────

  const handleStreamError = useCallback(() => {
    if (!enabled) return;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    retryTimerRef.current = setTimeout(() => {
      if (!enabled) return;
      const audio = audioRef.current;
      if (audio) {
        const sep = streamUrl.includes('?') ? '&' : '?';
        audio.src = `${streamUrl}${sep}t=${Date.now()}`;
        audio.load();
        audio.play().catch(() => { });
      }
    }, 1000);
  }, [enabled, streamUrl]);

  // ── Animation loop ──────────────────────────────────────────────────────

  const startAnimation = useCallback(() => {
    const ATTACK = 0.35;
    const RELEASE = 0.07;
    const dataL = new Uint8Array(FFT_SIZE);
    const dataR = new Uint8Array(FFT_SIZE);

    const tick = () => {
      animFrameRef.current = requestAnimationFrame(tick);

      const cfg = configRef.current;
      const imgs = imagesRef.current;
      const canvas = canvasRef.current;
      if (!cfg || !imgs || !canvas) return;
      if (!analyserLRef.current || !analyserRRef.current) return;

      const ctx = canvas.getContext('2d');

      // Read audio data
      analyserLRef.current.getByteTimeDomainData(dataL);
      analyserRRef.current.getByteTimeDomainData(dataR);

      const rawL = rmsToDb(calcRms(dataL));
      const rawR = rmsToDb(calcRms(dataR));

      // VU ballistics: fast attack, slow release
      const s = smoothedRef.current;
      s.left += (rawL - s.left) * (rawL > s.left ? ATTACK : RELEASE);
      s.right += (rawR - s.right) * (rawR > s.right ? ATTACK : RELEASE);

      const volL = dbToVolume(s.left);
      const volR = dbToVolume(s.right);

      renderMeterFrame(
        ctx,
        cfg,
        imgs,
        volL,
        volR,
        canvas.width,
        canvas.height,
        width,
        height,
      );
    };

    tick();
  }, [width, height]);

  // ── Enable on click ─────────────────────────────────────────────────────

  const handleEnable = useCallback(() => {
    if (enabled) return;
    setupAudio();
    startAnimation();
    setEnabled(true);
  }, [enabled, setupAudio, startAnimation]);

  // ── Stopped prop ────────────────────────────────────────────────────────

  useEffect(() => {
    if (stopped) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      const audio = audioRef.current;
      if (audio && !audio.paused) audio.pause();
    } else if (enabled) {
      const audio = audioRef.current;
      if (audio?.paused) audio.play().catch(() => { });
      if (!animFrameRef.current) startAnimation();
    }
  }, [stopped, enabled, startAnimation]);

  // ── Cleanup ─────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      const audio = audioRef.current;
      if (audio && !audio.paused) audio.pause();
    };
  }, []);

  // ── Draw static background when config/images load but not yet enabled ──

  useEffect(() => {
    if (enabled) return; // animation loop handles rendering
    const cfg = configRef.current;
    const imgs = imagesRef.current;
    const canvas = canvasRef.current;
    if (!cfg || !imgs || !canvas) return;

    const ctx = canvas.getContext('2d');
    renderMeterFrame(ctx, cfg, imgs, 0, 0, canvas.width, canvas.height, width, height);
  });

  // ── Render ──────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className={`peppy-meter peppy-meter--error ${className}`}>
        <p className="peppy-meter__error">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={`peppy-meter ${enabled ? 'peppy-meter--active' : ''} ${className}`}
      onClick={handleEnable}
    >
      {/* Hidden audio element for the stream */}
      <audio
        ref={audioRef}
        src={streamUrl}
        crossOrigin="anonymous"
        preload="auto"
        onError={handleStreamError}
      />

      <canvas
        ref={canvasRef}
        className="peppy-meter__canvas"
        width={width}
        height={height}
      />

      {!enabled && (
        <div className="peppy-meter__overlay">
          <span className="peppy-meter__play-hint">Click to activate</span>
        </div>
      )}
    </div>
  );
};

PeppyMeterDelete.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  folderName: PropTypes.string.isRequired,
  model: PropTypes.string.isRequired,
  streamUrl: PropTypes.string,
  stopped: PropTypes.bool,
  className: PropTypes.string,
};

export default PeppyMeterDelete;
