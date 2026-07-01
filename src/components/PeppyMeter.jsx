import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { SPECTRUM_STREAM_URL, PLUGIN_BASE_URL } from '@/config';
import { getServiceLogoUrl } from './ServiceLogo';
import { fetchMeterConfigs } from './peppy-meter/parseMeterConfig';
import { loadMeterImages, renderMeterFrame } from './peppy-meter/meterRenderer';
import PeppySpectrum from './peppy-spectrum/PeppySpectrum';
import useFanartTv from '@/hooks/useFanartTv';
import './peppy-meter/PeppyMeter.scss';

// MediaElementSourceNode can only be created ONCE per HTMLMediaElement.
// Shared module-level cache to reuse existing source nodes across remounts.
const mediaSourceCache = new WeakMap();

const FFT_SIZE = 1024;
const SMOOTH_BUFFER_SIZE = 4;
const NEEDLE_SENSITIVITY = 0.5;

const getChannelPeakLevel = (data) => {
  let peak = 0;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.abs((data[i] - 128) / 128);
    if (sample > peak) peak = sample;
  }
  return Math.max(0, Math.min(1, peak));
};

const getSmoothedLevel = (buffer, level) => {
  buffer.push(level);
  if (buffer.length > SMOOTH_BUFFER_SIZE) buffer.shift();
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) sum += buffer[i];
  return sum / buffer.length;
};

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
 */
const PeppyMeter = ({
  folder,
  model = 'random',
  trackUri,
  trackInfo,
  streamUrl = SPECTRUM_STREAM_URL,
  stopped = false,
  className = '',
}) => {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const analyserLRef = useRef(null);
  const analyserRRef = useRef(null);
  const animFrameRef = useRef(null);
  const smoothBuffersRef = useRef({ left: [], right: [] });
  const retryTimerRef = useRef(null);
  const embeddedSpectrumRef = useRef(null);
  const imagesRef = useRef(null);
  const configRef = useRef(null);
  const trackInfoRef = useRef(trackInfo);
  useEffect(() => { trackInfoRef.current = trackInfo; }, [trackInfo]);

  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState(null);
  const [allConfigs, setAllConfigs] = useState(null);
  const [activeModel, setActiveModel] = useState(null);
  const [fanartFrame, setFanartFrame] = useState(0);
  const prevRandomRef = useRef(null);

  // ── fanart.tv images for the current album (falls back to filesystem) ──
  const { data: fanartTvData } = useFanartTv({
    artist: trackInfo?.artist || null,
    album: trackInfo?.album || null,
  });
  const fanartTvImages = useMemo(() => {
    const imgs = fanartTvData?.images || [];
    return Array.isArray(imgs) ? imgs : [];
  }, [fanartTvData]);

  // Parse width/height from folder name (e.g. "1280x400-Gelo5-BASIC_221")
  const { nativeW, nativeH } = useMemo(() => {
    const m = folder?.match(/^(\d+)x(\d+)/);
    return m ? { nativeW: parseInt(m[1], 10), nativeH: parseInt(m[2], 10) } : { nativeW: 1280, nativeH: 400 };
  }, [folder]);

  const assetPath = useMemo(() => `${PLUGIN_BASE_URL}/peppy_meter/${folder}`, [folder]);

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
    if (!allConfigs || !trackUri) return;
    const names = Object.keys(allConfigs);
    if (!names.length) {
      setError('No meters found in meters.txt'); return;
    }

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

    loadMeterImages(cfg, assetPath).then((imgs) => {
      if (cancelled) return;
      imagesRef.current = imgs;
      // Draw initial static frame
      const canvas = canvasRef.current;
      if (canvas && !enabled) {
        const ctx = canvas.getContext('2d');
        // Compute initial turntable state for static render
        const hasTT = cfg.vinyl?.filename || cfg.tonearm?.filename || cfg.albumArt?.rotation;
        const ti = trackInfoRef.current;
        let initTurntable = null;
        if (hasTT) {
          const arm = cfg.tonearm;
          let armAngle = arm ? arm.angleRest : 0;
          if (arm && ti?.isPlaying) {
            const progress = ti.progress || 0;
            armAngle = arm.angleStart + progress * (arm.angleEnd - arm.angleStart);
          }
          initTurntable = { vinylAngle: 0, tonearmAngle: armAngle };
        }
        renderMeterFrame(ctx, cfg, imgs, 0, 0, canvas.width, canvas.height, nativeW, nativeH, 0, null, null, null, initTurntable, fanartRef.current, cdartRef.current, folderLayerRefs.current);
      }
    });

    return () => { cancelled = true; };
  }, [allConfigs, activeModel, assetPath, nativeW, nativeH, enabled]);

  // ── Load album art when track changes ─────────────────────────────────

  const albumArtRef = useRef(null);
  useEffect(() => {
    const cfg = configRef.current;
    const needsArt = cfg?.albumArt?.pos || cfg?.vinyl?.filename || cfg?.albumArt?.rotation;
    if (!needsArt || !trackInfo?.albumart) { albumArtRef.current = null; return; }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { if (!cancelled) albumArtRef.current = img; };
    img.onerror = () => { if (!cancelled) albumArtRef.current = null; };
    img.src = trackInfo.albumart;
    return () => { cancelled = true; };
  }, [trackInfo?.albumart, activeModel]);

  // ── Load fanart image when track changes (fallback to album art) ──────

  const fanartRef = useRef(null);

  // Advance fanart frame while a track is active.
  useEffect(() => {
    const cfg = configRef.current;
    const needsFanart = cfg?.fanart?.pos && cfg?.fanart?.dimension;
    const trackUriForFanart = trackInfo?.uri || trackUri;
    if (!needsFanart || !trackUriForFanart) return;

    setFanartFrame(0);
    const timer = setInterval(() => {
      setFanartFrame((n) => n + 1);
    }, 10000);

    return () => clearInterval(timer);
  }, [trackInfo?.uri, trackUri, activeModel]);

  useEffect(() => {
    const cfg = configRef.current;
    const needsFanart = cfg?.fanart?.pos && cfg?.fanart?.dimension;
    if (!needsFanart) { fanartRef.current = null; return; }

    const trackUriForFanart = trackInfo?.uri || trackUri;
    const candidates = [];
    // Prefer fanart.tv images when available (rotates by fanartFrame).
    if (fanartTvImages.length) {
      const idxTv = fanartFrame % fanartTvImages.length;
      // Add the current rotation first, then the rest as fallbacks.
      candidates.push(fanartTvImages[idxTv]);
      for (let k = 1; k < fanartTvImages.length; k++) {
        candidates.push(fanartTvImages[(idxTv + k) % fanartTvImages.length]);
      }
    }
    if (trackInfo?.fanart) candidates.push(trackInfo.fanart);
    if (trackUriForFanart) {
      candidates.push(`${PLUGIN_BASE_URL}/api/track-asset?uri=${encodeURIComponent(trackUriForFanart)}&name=fanart&index=${fanartFrame}`);
      candidates.push(`${PLUGIN_BASE_URL}/api/fanart?uri=${encodeURIComponent(trackUriForFanart)}&index=${fanartFrame}`);
    }
    if (trackInfo?.albumart) candidates.push(trackInfo.albumart);

    if (!candidates.length) { fanartRef.current = null; return; }

    let cancelled = false;
    let idx = 0;

    const tryNext = () => {
      if (cancelled) return;
      if (idx >= candidates.length) {
        fanartRef.current = null;
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      const src = candidates[idx++];
      img.onload = () => {
        if (!cancelled) fanartRef.current = img;
      };
      img.onerror = () => {
        if (!cancelled) tryNext();
      };
      img.src = src;
    };

    tryNext();

    return () => { cancelled = true; };
  }, [trackInfo?.fanart, trackInfo?.albumart, trackInfo?.uri, trackUri, activeModel, fanartFrame, fanartTvImages]);

  // ── Load cdart mask from track directory (if present) ──────────────────

  const cdartRef = useRef(null);
  useEffect(() => {
    const cfg = configRef.current;
    const needsCdart = !!cfg?.vinyl?.filename;
    const trackUriForAssets = trackInfo?.uri || trackUri;
    if (!needsCdart || !trackUriForAssets) { cdartRef.current = null; return; }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { if (!cancelled) cdartRef.current = img; };
    img.onerror = () => { if (!cancelled) cdartRef.current = null; };
    img.src = `${PLUGIN_BASE_URL}/api/track-asset?uri=${encodeURIComponent(trackUriForAssets)}&name=cdart`;

    return () => { cancelled = true; };
  }, [trackInfo?.uri, trackUri, activeModel]);

  // ── Load folderlayer images from track directory (back/logo/etc.) ───────

  const folderLayerRefs = useRef([]);
  useEffect(() => {
    const cfg = configRef.current;
    const layers = Array.isArray(cfg?.folderLayers) ? cfg.folderLayers : [];
    const trackUriForAssets = trackInfo?.uri || trackUri;
    if (!layers.length || !trackUriForAssets) { folderLayerRefs.current = []; return; }

    let cancelled = false;

    Promise.all(layers.map((layer) => {
      const files = Array.isArray(layer.files) ? layer.files : [];
      if (!files.length) return Promise.resolve(null);

      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = `${PLUGIN_BASE_URL}/api/track-asset?uri=${encodeURIComponent(trackUriForAssets)}&candidates=${encodeURIComponent(files.join(','))}`;
      });
    })).then((images) => {
      if (!cancelled) {
        folderLayerRefs.current = images;
      }
    });

    return () => { cancelled = true; folderLayerRefs.current = []; };
  }, [trackInfo?.uri, trackUri, activeModel]);

  // ── Load format/service icon when track type changes ────────────────────

  const formatIconRef = useRef(null);
  useEffect(() => {
    const cfg = configRef.current;
    if (!cfg?.playInfo?.type?.pos) { formatIconRef.current = null; return; }
    const trackType = (trackInfo?.trackType || '').toLowerCase().replace(/\s+/g, '');
    const service = (trackInfo?.service || '').toLowerCase().replace(/[_\s-]+/g, '');
    if (!trackType && !service) { formatIconRef.current = null; return; }

    // Try format icon first (flac, mp3, dsd, etc.), then service logo via ServiceLogo
    const candidates = [];
    if (trackType) {
      const fmt = trackType === 'dsf' ? 'dsd' : trackType;
      // If trackType matches a known service, use its logo URL
      const serviceUrl = getServiceLogoUrl(fmt);
      if (serviceUrl) {
        candidates.push(serviceUrl);
      } else {
        candidates.push(`/assets/logos/${fmt}.svg`);
      }
    }
    if (service && service !== 'mpd') {
      const serviceUrl = getServiceLogoUrl(service);
      if (serviceUrl) {
        candidates.push(serviceUrl);
      }
    }

    let cancelled = false;
    let loaded = false;
    for (const src of candidates) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!cancelled && !loaded) { loaded = true; formatIconRef.current = img; }
      };
      img.onerror = () => { };
      img.src = src;
    }
    // If nothing loads, clear after a short delay
    const timer = setTimeout(() => { if (!loaded && !cancelled) formatIconRef.current = null; }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [trackInfo?.trackType, trackInfo?.service, activeModel]);

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
      analyserL.smoothingTimeConstant = 0.5;
      analyserR.smoothingTimeConstant = 0.5;
      analyserL.minDecibels = -85;
      analyserR.minDecibels = -85;
      analyserL.maxDecibels = -25;
      analyserR.maxDecibels = -25;
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
    smoothBuffersRef.current = { left: [], right: [] };
    const dataL = new Uint8Array(FFT_SIZE);
    const dataR = new Uint8Array(FFT_SIZE);
    let lastTime = performance.now();
    let reelAngle = 0;
    let vinylAngle = 0;
    let tonearmAngle = null; // null = needs initialization from config
    let tonearmTarget = null;
    let tonearmState = null; // null = needs initialization, then 'rest' | 'dropping' | 'playing' | 'lifting'

    const tick = () => {
      animFrameRef.current = requestAnimationFrame(tick);

      const cfg = configRef.current;
      const imgs = imagesRef.current;
      const canvas = canvasRef.current;
      if (!cfg || !imgs || !canvas) return;
      if (!analyserLRef.current || !analyserRRef.current) return;

      const now = performance.now();
      const dt = (now - lastTime) / 1000; // seconds
      lastTime = now;

      const ctx = canvas.getContext('2d');

      analyserLRef.current.getByteTimeDomainData(dataL);
      analyserRRef.current.getByteTimeDomainData(dataR);

      const rawL = getChannelPeakLevel(dataL);
      const rawR = getChannelPeakLevel(dataR);
      const smooth = smoothBuffersRef.current;
      const leftLevel = Math.max(0, Math.min(1, getSmoothedLevel(smooth.left, rawL) * NEEDLE_SENSITIVITY));
      const rightLevel = Math.max(0, Math.min(1, getSmoothedLevel(smooth.right, rawR) * NEEDLE_SENSITIVITY));

      // Accumulate reel rotation only when audio is playing (signal detected)
      if (cfg.reel && (rawL > 0.01 || rawR > 0.01)) {
        reelAngle += cfg.reel.rotationSpeed * dt * 6;
        if (reelAngle >= 360) reelAngle -= 360;
      }

      // ── Turntable animation ────────────────────────────────────────────
      let turntableState = null;
      const hasTurntable = cfg.vinyl?.filename || cfg.tonearm?.filename || cfg.albumArt?.rotation;

      if (hasTurntable) {
        const ti = trackInfoRef.current;
        const isPlaying = ti?.isPlaying;
        const progress = ti?.progress || 0;

        // Vinyl/albumart rotation — spin when playing
        const rotSpeed = cfg.albumArt?.rotationSpeed || 33;
        if (isPlaying) {
          vinylAngle += rotSpeed * dt * 2; // gentle visual spin
          if (vinylAngle >= 360) vinylAngle -= 360;
        }

        // Tonearm state machine
        if (cfg.tonearm?.filename) {
          const arm = cfg.tonearm;
          const dropSpeed = Math.abs(arm.angleStart - arm.angleRest) / arm.dropDuration;
          const liftSpeed = Math.abs(arm.angleStart - arm.angleRest) / arm.liftDuration;
          // Target angle based on progress (interpolate start→end)
          const progressAngle = arm.angleStart + progress * (arm.angleEnd - arm.angleStart);

          // First-frame initialization: snap to correct position
          if (tonearmState === null) {
            if (isPlaying) {
              // Already playing when viz loaded — snap directly to playing position
              tonearmAngle = progressAngle;
              tonearmState = 'playing';
            } else {
              tonearmAngle = arm.angleRest;
              tonearmState = 'rest';
            }
          }

          // State transitions
          if (isPlaying && (tonearmState === 'rest' || tonearmState === 'lifting')) {
            tonearmState = 'dropping';
            tonearmTarget = progressAngle;
          } else if (!isPlaying && (tonearmState === 'playing' || tonearmState === 'dropping')) {
            tonearmState = 'lifting';
            tonearmTarget = arm.angleRest;
          }

          // Animate
          if (tonearmState === 'dropping') {
            const diff = tonearmTarget - tonearmAngle;
            const step = dropSpeed * dt;
            if (Math.abs(diff) <= step) {
              tonearmAngle = tonearmTarget;
              tonearmState = 'playing';
            } else {
              tonearmAngle += Math.sign(diff) * step;
            }
          } else if (tonearmState === 'playing') {
            // Follow progress smoothly
            tonearmAngle = progressAngle;
          } else if (tonearmState === 'lifting') {
            const diff = tonearmTarget - tonearmAngle;
            const step = liftSpeed * dt;
            if (Math.abs(diff) <= step) {
              tonearmAngle = tonearmTarget;
              tonearmState = 'rest';
            } else {
              tonearmAngle += Math.sign(diff) * step;
            }
          }
        }

        turntableState = { vinylAngle, tonearmAngle: tonearmAngle != null ? tonearmAngle : 0 };
      }

      renderMeterFrame(ctx, cfg, imgs, leftLevel, rightLevel, canvas.width, canvas.height, nativeW, nativeH, reelAngle, trackInfoRef.current, albumArtRef.current, formatIconRef.current, turntableState, fanartRef.current, cdartRef.current, folderLayerRefs.current);
    };

    tick();
  }, [nativeW, nativeH]);

  // ── Auto-enable when playback starts ─────────────────────────────────────

  useEffect(() => {
    if (enabled || !trackInfo?.isPlaying || !imagesRef.current) return;
    setupAudio();
    startAnimation();

    setEnabled(true);
  }, [enabled, trackInfo?.isPlaying, setupAudio, startAnimation]);

  // ── Enable on click ─────────────────────────────────────────────────────

  const handleEnable = useCallback(() => {
    if (enabled) return;
    setupAudio();
    startAnimation();
    setEnabled(true);
    embeddedSpectrumRef.current?.enable();
  }, [enabled, setupAudio, startAnimation]);

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

      {embeddedSpectrum && (
        <PeppySpectrum
          ref={embeddedSpectrumRef}
          folder={folder}
          model={embeddedSpectrum.name}
          trackUri={trackUri}
          streamUrl={streamUrl}
          stopped={stopped}
          clipSize={embeddedSpectrum.size}
          className="peppy-meter__embedded-spectrum"
          hidden={!enabled}
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


export default PeppyMeter;
