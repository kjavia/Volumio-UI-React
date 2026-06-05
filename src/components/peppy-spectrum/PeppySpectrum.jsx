import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { SPECTRUM_STREAM_URL, PLUGIN_BASE_URL } from '@/config';
import { fetchSpectrumConfigs } from './parseSpectrumConfig';
import { loadSpectrumImages, renderSpectrumFrame } from './spectrumRenderer';
import './PeppySpectrum.scss';

// MediaElementSourceNode can only be created ONCE per HTMLMediaElement.
// Shared module-level cache to reuse existing source nodes across remounts.
const mediaSourceCache = new WeakMap();

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
 * PeppySpectrum — canvas-based frequency spectrum using PeppyMeter-style assets.
 *
 * @param {string} props.folder — full folder name e.g. "1280x400+30-Gelo5"
 * @param {string} props.model — spectrum section name from spectrum.txt, or "random"
 * @param {string} [props.trackUri] — current track URI; when it changes and model is "random", a new spectrum is picked
 * @param {string} [props.streamUrl] — audio stream URL
 * @param {boolean} [props.stopped] — pause animation & audio
 * @param {string} [props.className] — additional CSS class names
 */
const PeppySpectrum = ({
  folder,
  model = 'random',
  trackUri,
  streamUrl = SPECTRUM_STREAM_URL,
  stopped = false,
  className = '',
  autoEnable = false,
  clipSize = null,
}) => {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const toppingsRef = useRef(null);
  const retryTimerRef = useRef(null);
  const imagesRef = useRef(null);
  const configRef = useRef(null);

  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState(null);
  const [allConfigs, setAllConfigs] = useState(null);
  const [activeModel, setActiveModel] = useState(null);
  const prevRandomRef = useRef(null);

  // Parse width, height, and optionally numBars from folder name (e.g. "1280x400+30-Gelo5")
  // Embedded spectrums (clipSize provided) default to 20 bars; standalone defaults to 30
  const { nativeW, nativeH, numBars } = useMemo(() => {
    const defaultBars = clipSize ? 20 : 30;
    const m = folder?.match(/^(\d+)x(\d+)(?:\+(\d+))?/);
    if (m) {
      return {
        nativeW: parseInt(m[1], 10),
        nativeH: parseInt(m[2], 10),
        numBars: m[3] ? parseInt(m[3], 10) : defaultBars,
      };
    }
    return { nativeW: 1280, nativeH: 400, numBars: defaultBars };
  }, [folder, clipSize]);

  // Use large FFT for good frequency resolution
  const FFT_SIZE = 8192;

  // Pre-compute log-frequency bin ranges for each bar (20Hz–20kHz log scale)
  const barBinRanges = useMemo(() => {
    const sampleRate = 44100;
    const binCount = FFT_SIZE / 2;
    const minFreq = 20;
    const maxFreq = 20000;
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const ranges = new Array(numBars);
    for (let i = 0; i < numBars; i++) {
      const freqLow = Math.pow(10, logMin + (logMax - logMin) * (i / numBars));
      const freqHigh = Math.pow(10, logMin + (logMax - logMin) * ((i + 1) / numBars));
      const binLow = Math.round(freqLow * FFT_SIZE / sampleRate);
      const binHigh = Math.round(freqHigh * FFT_SIZE / sampleRate);
      ranges[i] = [Math.max(0, binLow), Math.min(binCount - 1, Math.max(binLow + 1, binHigh))];
    }
    return ranges;
  }, [numBars]);

  const assetPath = useMemo(() => `${PLUGIN_BASE_URL}/peppy_spectrum/${folder}`, [folder]);

  // ── Load all spectrum configs from the folder ─────────────────────────

  useEffect(() => {
    if (!folder) return;
    let cancelled = false;

    fetchSpectrumConfigs(`${assetPath}/spectrum.txt?_t=${Date.now()}`)
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
    if (!allConfigs || !trackUri) return;
    const names = Object.keys(allConfigs);
    if (!names.length) { // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('No spectrums found in config'); return;
    }

    if (model === 'random') {
      const picked = pickRandom(names, prevRandomRef.current);
      prevRandomRef.current = picked;
      setActiveModel(picked);
    } else if (allConfigs[model]) {
      setActiveModel(model);
    } else {
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
    imagesRef.current = null;
    toppingsRef.current = new Float32Array(numBars);

    loadSpectrumImages(cfg, assetPath).then((imgs) => {
      if (cancelled) return;
      imagesRef.current = imgs;
      // Draw initial static frame
      const canvas = canvasRef.current;
      if (canvas && !enabled) {
        const ctx = canvas.getContext('2d');
        const emptyData = new Uint8Array(numBars);
        renderSpectrumFrame(ctx, cfg, imgs, emptyData, null, canvas.width, canvas.height, nativeW, nativeH, numBars, clipSize);
      }
    });

    return () => { cancelled = true; };
  }, [allConfigs, activeModel, assetPath, nativeW, nativeH, numBars, enabled, clipSize]);

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

    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.5;
      analyser.minDecibels = -85;
      analyser.maxDecibels = -25;
      sourceNode.connect(analyser);
      analyserRef.current = analyser;
    }

    audio.play().catch((e) => console.warn('[PeppySpectrum] play failed:', e));
  }, [FFT_SIZE]);

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
    const freqData = new Uint8Array(FFT_SIZE / 2);

    const tick = () => {
      animFrameRef.current = requestAnimationFrame(tick);

      const cfg = configRef.current;
      const imgs = imagesRef.current;
      const canvas = canvasRef.current;
      if (!cfg || !imgs || !canvas) return;
      if (!analyserRef.current) return;

      const ctx = canvas.getContext('2d');
      analyserRef.current.getByteFrequencyData(freqData);

      // Map FFT bins to bars using pre-computed log-frequency ranges
      // Use peak value per band (like cava) for uniform-looking bars
      const barData = new Uint8Array(numBars);
      for (let i = 0; i < numBars; i++) {
        const [binLow, binHigh] = barBinRanges[i];
        let peak = 0;
        for (let b = binLow; b < binHigh; b++) {
          if (freqData[b] > peak) peak = freqData[b];
        }
        barData[i] = peak;
      }

      // Update toppings (peak hold with decay matching PeppySpectrum behavior)
      const tops = toppingsRef.current;
      if (tops) {
        const toppingStep = (cfg.toppingStep || 3) / (cfg.barHeight || 200);
        const toppingH = (cfg.toppingHeight || 2) / (cfg.barHeight || 200);
        for (let i = 0; i < numBars; i++) {
          const current = barData[i] / 255;
          if (current >= tops[i] - toppingH - toppingStep) {
            // Bar reached/exceeded topping — jump topping above bar
            tops[i] = current + toppingH + toppingStep;
            if (tops[i] > 1) tops[i] = 1;
          } else {
            // Topping falls by step per frame
            tops[i] = Math.max(0, tops[i] - toppingStep);
          }
        }
      }

      renderSpectrumFrame(ctx, cfg, imgs, barData, tops, canvas.width, canvas.height, nativeW, nativeH, numBars, clipSize);
    };

    tick();
  }, [barBinRanges, nativeW, nativeH, numBars, clipSize]);

  // ── Enable on click ─────────────────────────────────────────────────────

  const handleEnable = useCallback(() => {
    if (enabled) return;
    setupAudio();
    startAnimation();
    setEnabled(true);
  }, [enabled, setupAudio, startAnimation]);

  // ── Auto-enable (for embedded use inside PeppyMeter) ──────────────────

  useEffect(() => {
    if (autoEnable && !enabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleEnable();
    }
  }, [autoEnable, enabled, handleEnable]);

  // ── Restart animation when model/config changes while already active ────

  useEffect(() => {
    if (!enabled || stopped) return;
    // Cancel previous loop and start fresh with new startAnimation closure
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = null;
    startAnimation();
  }, [startAnimation]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Render ──────────────────────────────────────────────────────────────

  if (!folder) {
    return (
      <div className={`peppy-spectrum peppy-spectrum--error ${className}`}>
        <p className="peppy-spectrum__error">No Peppy Spectrum pack selected. Configure in Settings.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`peppy-spectrum peppy-spectrum--error ${className}`}>
        <p className="peppy-spectrum__error">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={`peppy-spectrum ${enabled ? 'peppy-spectrum--active' : ''} ${className}`}
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
        className="peppy-spectrum__canvas"
        width={nativeW}
        height={nativeH}
      />

      {!enabled && (
        <div className="peppy-spectrum__overlay">
          <span className="peppy-spectrum__play-hint">Click to activate</span>
        </div>
      )}
    </div>
  );
};

PeppySpectrum.propTypes = {
  folder: PropTypes.string.isRequired,
  model: PropTypes.string,
  trackUri: PropTypes.string,
  streamUrl: PropTypes.string,
  stopped: PropTypes.bool,
  className: PropTypes.string,
  autoEnable: PropTypes.bool,
  clipSize: PropTypes.shape({ w: PropTypes.number, h: PropTypes.number }),
};

export default PeppySpectrum;
