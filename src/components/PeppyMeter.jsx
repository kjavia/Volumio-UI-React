import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { SPECTRUM_STREAM_URL, PLUGIN_BASE_URL } from '@/config';
import { fetchMeterConfigs } from './peppy-meter/parseMeterConfig';
import { loadMeterImages, renderMeterFrame } from './peppy-meter/meterRenderer';
import PeppySpectrum from './peppy-spectrum/PeppySpectrum';
import './peppy-meter/PeppyMeter.scss';

// MediaElementSourceNode can only be created ONCE per HTMLMediaElement.
// Shared module-level cache to reuse existing source nodes across remounts.
const mediaSourceCache = new WeakMap();

const FFT_SIZE = 1024;
const MIN_DB = -20;
const MAX_DB = 5;
const DB_RANGE = MAX_DB - MIN_DB;

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
 * Pick a random element from an array, avoiding the previous pick when possible.
 */
const pickRandom = (arr, prev) => {
  if (!arr.length) return null;
  if (arr.length === 1) return arr[0];
  const filtered = arr.filter((x) => x !== prev);
  return filtered[Math.floor(Math.random() * filtered.length)];
};

/**
 * PeppyMeter — canvas-based VU/level meter using PeppyMeter-style assets.
 *
 * @param {string} props.folder — full folder name e.g. "1280x400-Gelo5-BASIC_221"
 * @param {string} props.model — meter section name from meters.txt, or "random"
 * @param {string} [props.trackUri] — current track URI; when it changes and model is "random", a new meter is picked
 * @param {string} [props.streamUrl] — audio stream URL
 * @param {boolean} [props.stopped] — pause animation & audio
 * @param {string} [props.className] — additional CSS class names
 * @param {Object} [props.trackInfo] — { title, artist, album, albumart, samplerate, remaining }
 */
const PeppyMeter = ({
  folder,
  model = 'random',
  trackUri,
  streamUrl = SPECTRUM_STREAM_URL,
  stopped = false,
  className = '',
  trackInfo = null,
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
  const [allConfigs, setAllConfigs] = useState(null);
  const [activeModel, setActiveModel] = useState(null);
  const prevRandomRef = useRef(null);
  const trackInfoRef = useRef(trackInfo);

  // Parse width/height from folder name (e.g. "1280x400-Gelo5-BASIC_221")
  const { nativeW, nativeH } = useMemo(() => {
    const m = folder?.match(/^(\d+)x(\d+)/);
    return m ? { nativeW: parseInt(m[1], 10), nativeH: parseInt(m[2], 10) } : { nativeW: 1280, nativeH: 400 };
  }, [folder]);

  const assetPath = useMemo(() => `${PLUGIN_BASE_URL}/peppy_meter/${folder}`, [folder]);

  // Keep trackInfoRef in sync
  useEffect(() => { trackInfoRef.current = trackInfo; }, [trackInfo]);

  // ── Load all meter configs from the folder ────────────────────────────

  useEffect(() => {
    if (!folder) return;
    let cancelled = false;

    fetchMeterConfigs(`${assetPath}/meters.txt?_t=${Date.now()}`)
      .then((configs) => {
        if (cancelled) return;
        setAllConfigs(configs);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });

    return () => { cancelled = true; };
  }, [assetPath, folder]);

  // ── Resolve active model (handle "random" + track changes) ────────────

  useEffect(() => {
    if (!allConfigs) return;
    const names = Object.keys(allConfigs);
    if (!names.length) { setError('No meters found in meters.txt'); return; }

    if (model === 'random') {
      const picked = pickRandom(names, prevRandomRef.current);
      prevRandomRef.current = picked;
      setActiveModel(picked);
    } else if (allConfigs[model]) {
      setActiveModel(model);
    } else {
      // Fallback to first available meter
      setActiveModel(names[0]);
    }
  }, [allConfigs, model, trackUri]);

  // ── Load images for the active model ──────────────────────────────────

  useEffect(() => {
    if (!allConfigs || !activeModel) return;
    const cfg = allConfigs[activeModel];
    if (!cfg) return;

    let cancelled = false;
    configRef.current = cfg;
    imagesRef.current = null; // clear while loading

    loadMeterImages(cfg, assetPath, trackInfo?.albumart || '').then((imgs) => {
      if (cancelled) return;
      imagesRef.current = imgs;
      // Draw initial static frame
      const canvas = canvasRef.current;
      if (canvas && !enabled) {
        const ctx = canvas.getContext('2d');
        renderMeterFrame(ctx, cfg, imgs, 0, 0, canvas.width, canvas.height, nativeW, nativeH, trackInfoRef.current);
      }
    });

    return () => { cancelled = true; };
  }, [allConfigs, activeModel, assetPath, nativeW, nativeH, enabled, trackInfo?.albumart]);

  // ── Audio setup ─────────────────────────────────────────────────────────

  const setupAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = false;

    let entry = mediaSourceCache.get(audio);
    if (!entry) {
      const ctx = new AudioContext({ sampleRate: 44100 });
      if (ctx.destination?.context?.setSinkId) {
        ctx.setSinkId({ type: 'none' }).catch(() => { });
      }
      const sourceNode = ctx.createMediaElementSource(audio);
      entry = { ctx, sourceNode };
      mediaSourceCache.set(audio, entry);
    }

    if (entry.ctx.state === 'suspended') entry.ctx.resume();

    const { sourceNode, ctx } = entry;

    if (!analyserLRef.current) {
      const analyserL = ctx.createAnalyser();
      const analyserR = ctx.createAnalyser();
      analyserL.fftSize = FFT_SIZE;
      analyserR.fftSize = FFT_SIZE;
      analyserL.smoothingTimeConstant = 0;
      analyserR.smoothingTimeConstant = 0;
      sourceNode.connect(analyserL);
      sourceNode.connect(analyserR);
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

      analyserLRef.current.getByteTimeDomainData(dataL);
      analyserRRef.current.getByteTimeDomainData(dataR);

      const rawL = rmsToDb(calcRms(dataL));
      const rawR = rmsToDb(calcRms(dataR));

      const s = smoothedRef.current;
      s.left += (rawL - s.left) * (rawL > s.left ? ATTACK : RELEASE);
      s.right += (rawR - s.right) * (rawR > s.right ? ATTACK : RELEASE);

      renderMeterFrame(ctx, cfg, imgs, dbToVolume(s.left), dbToVolume(s.right), canvas.width, canvas.height, nativeW, nativeH, trackInfoRef.current);
    };

    tick();
  }, [nativeW, nativeH]);

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
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
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

  // Determine if embedded spectrum should be shown
  const activeConfig = allConfigs && activeModel ? allConfigs[activeModel] : null;
  const embeddedSpectrum = activeConfig?.spectrumVisible && activeConfig?.spectrumName
    ? { name: activeConfig.spectrumName, size: activeConfig.spectrumSize }
    : null;

  // ── Render ──────────────────────────────────────────────────────────────

  if (!folder) {
    return (
      <div className={`peppy-meter peppy-meter--error ${className}`}>
        <p className="peppy-meter__error">No Peppy Meter pack selected. Configure in Settings.</p>
      </div>
    );
  }

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
        width={nativeW}
        height={nativeH}
      />

      {embeddedSpectrum && enabled && (
        <PeppySpectrum
          folder={folder}
          model={embeddedSpectrum.name}
          trackUri={trackUri}
          streamUrl={streamUrl}
          stopped={stopped}
          autoEnable
          className="peppy-meter__embedded-spectrum"
        />
      )}

      {!enabled && (
        <div className="peppy-meter__overlay">
          <span className="peppy-meter__play-hint">Click to activate</span>
        </div>
      )}
    </div>
  );
};

PeppyMeter.propTypes = {
  folder: PropTypes.string.isRequired,
  model: PropTypes.string,
  trackUri: PropTypes.string,
  streamUrl: PropTypes.string,
  stopped: PropTypes.bool,
  className: PropTypes.string,
  trackInfo: PropTypes.shape({
    title: PropTypes.string,
    artist: PropTypes.string,
    album: PropTypes.string,
    albumart: PropTypes.string,
    samplerate: PropTypes.string,
    remaining: PropTypes.string,
  }),
};

export default PeppyMeter;
