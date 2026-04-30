import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { SPECTRUM_STREAM_URL } from '@/config';
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

    // Parse width, height, and numBars from folder name (e.g. "1280x400+30-Gelo5")
    const { nativeW, nativeH, numBars } = useMemo(() => {
        const m = folder?.match(/^(\d+)x(\d+)\+(\d+)-/);
        if (m) {
            return { nativeW: parseInt(m[1], 10), nativeH: parseInt(m[2], 10), numBars: parseInt(m[3], 10) };
        }
        // Fallback: try without numBars
        const m2 = folder?.match(/^(\d+)x(\d+)-/);
        return m2
            ? { nativeW: parseInt(m2[1], 10), nativeH: parseInt(m2[2], 10), numBars: 30 }
            : { nativeW: 1280, nativeH: 400, numBars: 30 };
    }, [folder]);

    const FFT_SIZE = useMemo(() => {
        // Need at least numBars * 2 for the FFT size (must be power of 2)
        let size = 64;
        while (size / 2 < numBars) size *= 2;
        return Math.max(256, size);
    }, [numBars]);

    const assetPath = useMemo(() => `/peppy_spectrum/${folder}`, [folder]);

    // ── Load all spectrum configs from the folder ─────────────────────────

    useEffect(() => {
        if (!folder) return;
        let cancelled = false;

        fetchSpectrumConfigs(`${assetPath}/spectrum.txt`)
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
        if (!names.length) { setError('No spectrums found in spectrum.txt'); return; }

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
                renderSpectrumFrame(ctx, cfg, imgs, emptyData, null, canvas.width, canvas.height, nativeW, nativeH, numBars);
            }
        });

        return () => { cancelled = true; };
    }, [allConfigs, activeModel, assetPath, nativeW, nativeH, numBars, enabled]);

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
            analyser.smoothingTimeConstant = 0.6;
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

            // Map FFT bins to our bar count
            const binCount = analyserRef.current.frequencyBinCount;
            const barData = new Uint8Array(numBars);
            for (let i = 0; i < numBars; i++) {
                // Use logarithmic frequency distribution
                const startBin = Math.floor(Math.pow(i / numBars, 1.5) * binCount);
                const endBin = Math.floor(Math.pow((i + 1) / numBars, 1.5) * binCount);
                let sum = 0;
                let count = 0;
                for (let b = startBin; b < endBin && b < binCount; b++) {
                    sum += freqData[b];
                    count++;
                }
                barData[i] = count > 0 ? sum / count : 0;
            }

            // Update toppings (peak hold with decay)
            const tops = toppingsRef.current;
            if (tops) {
                const toppingStep = cfg.toppingStep || 3;
                for (let i = 0; i < numBars; i++) {
                    const current = barData[i] / 255;
                    if (current >= tops[i]) {
                        tops[i] = current;
                    } else {
                        tops[i] = Math.max(0, tops[i] - (toppingStep / 255));
                    }
                }
            }

            renderSpectrumFrame(ctx, cfg, imgs, barData, tops, canvas.width, canvas.height, nativeW, nativeH, numBars);
        };

        tick();
    }, [FFT_SIZE, nativeW, nativeH, numBars]);

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
};

export default PeppySpectrum;
