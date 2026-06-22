import { useEffect, useRef, useMemo } from 'react';
import './weather-effects.scss';

/* ── WMO code → effect type + density ────────────────────────────────── */

const getEffect = (code) => {
  if (code == null) return null;
  if ([0, 1, 2, 3].includes(code)) return null; // clear / partly cloudy
  if (code === 45) return { type: 'fog', density: 'light' };
  if (code === 48) return { type: 'fog', density: 'dense' };
  if (code === 51) return { type: 'rain', density: 'drizzle' };
  if ([53, 56].includes(code)) return { type: 'rain', density: 'light' };
  if ([55, 57].includes(code)) return { type: 'rain', density: 'moderate' };
  if ([61, 80].includes(code)) return { type: 'rain', density: 'light' };
  if ([63, 66, 81].includes(code)) return { type: 'rain', density: 'moderate' };
  if ([65, 67, 82].includes(code)) return { type: 'rain', density: 'heavy' };
  if ([71, 77, 85].includes(code)) return { type: 'snow', density: 'gentle' };
  if ([73, 86].includes(code)) return { type: 'snow', density: 'moderate' };
  if (code === 75) return { type: 'snow', density: 'storm' };
  if (code === 95) return { type: 'thunder', density: 'moderate' };
  if ([96, 99].includes(code)) return { type: 'thunder', density: 'heavy' };
  return null;
};

/* ── Rain particle configs ────────────────────────────────────────────── */
// speed/len/width in px-at-60fps; angle in radians from vertical

const RAIN_CFG = {
  drizzle: { count: 80, speed: [1.5, 3.0], len: [5, 12], width: [0.4, 0.9], angle: 0.15, alpha: [0.08, 0.28] },
  light: { count: 150, speed: [3.5, 7.0], len: [10, 20], width: [0.5, 1.2], angle: 0.20, alpha: [0.15, 0.40] },
  moderate: { count: 260, speed: [7.0, 13.0], len: [15, 30], width: [0.8, 1.8], angle: 0.25, alpha: [0.25, 0.55] },
  heavy: { count: 420, speed: [13.0, 22.0], len: [20, 45], width: [1.0, 2.5], angle: 0.30, alpha: [0.35, 0.65] },
};

/* ── Snow particle configs ────────────────────────────────────────────── */

const SNOW_CFG = {
  gentle: { count: 80, speed: [0.25, 0.80], size: [1.5, 4.0], sway: 0.6, swaySpd: 0.012, wind: 0.20, alpha: [0.40, 0.85] },
  moderate: { count: 180, speed: [0.60, 1.80], size: [1.0, 5.0], sway: 1.2, swaySpd: 0.022, wind: 0.70, alpha: [0.50, 0.90] },
  storm: { count: 360, speed: [1.50, 4.50], size: [0.8, 6.0], sway: 2.8, swaySpd: 0.040, wind: 2.50, alpha: [0.50, 0.95] },
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

const rand = (min, max) => min + Math.random() * (max - min);

/* ── Rain particle factory ────────────────────────────────────────────── */

const makeRainDrop = (cfg, w, h, scatter = true) => ({
  x: rand(-60, w + 60),
  y: scatter ? rand(-h, h) : rand(-60, -5),
  spd: rand(...cfg.speed),
  len: rand(...cfg.len),
  wid: rand(...cfg.width),
  alpha: rand(...cfg.alpha),
});

/* ── Snow particle factory ────────────────────────────────────────────── */

const makeSnowFlake = (cfg, w, h, scatter = true) => ({
  x: rand(0, w),
  y: scatter ? rand(-h, h) : rand(-12, -2),
  spd: rand(...cfg.speed),
  sz: rand(...cfg.size),
  sway: (Math.random() - 0.5) * cfg.sway * 2,
  phase: Math.random() * Math.PI * 2,
  alpha: rand(...cfg.alpha),
});

/* ── Draw: rain ───────────────────────────────────────────────────────── */

const drawRain = (ctx, drops, cfg, w, h, dt) => {
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';
  const sinA = Math.sin(cfg.angle);
  const cosA = Math.cos(cfg.angle);
  const step = dt * 60;

  for (const d of drops) {
    d.y += d.spd * cosA * step;
    d.x += d.spd * sinA * step;

    if (d.y > h + d.len) {
      Object.assign(d, makeRainDrop(cfg, w, h, false));
    }

    ctx.beginPath();
    ctx.strokeStyle = `rgba(174,214,241,${d.alpha})`;
    ctx.lineWidth = d.wid;
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + sinA * d.len, d.y + cosA * d.len);
    ctx.stroke();
  }
};

/* ── Draw: snow ───────────────────────────────────────────────────────── */

const drawSnow = (ctx, flakes, cfg, w, h, t, dt) => {
  ctx.clearRect(0, 0, w, h);
  const step = dt * 60;

  for (const f of flakes) {
    f.y += f.spd * step;
    f.x += Math.sin(t * cfg.swaySpd + f.phase) * f.sway * 0.5;
    f.x += cfg.wind * 0.08 * step;

    if (f.y > h + f.sz) Object.assign(f, makeSnowFlake(cfg, w, h, false));
    if (f.x > w + f.sz) f.x = -f.sz;
    if (f.x < -f.sz) f.x = w + f.sz;

    ctx.beginPath();
    ctx.arc(f.x, f.y, f.sz, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${f.alpha})`;
    ctx.fill();
  }
};

/* ── WeatherEffects ───────────────────────────────────────────────────── */

const WeatherEffects = ({ weatherCode }) => {
  const canvasRef = useRef(null);
  const loopRef = useRef({ animId: null, particles: null, t: 0 });
  const effect = useMemo(() => getEffect(weatherCode), [weatherCode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !effect || effect.type === 'fog') return;

    const ctx = canvas.getContext('2d');
    const isRain = effect.type === 'rain' || effect.type === 'thunder';
    const isSnow = effect.type === 'snow';
    const rainCfg = isRain ? (RAIN_CFG[effect.density] ?? RAIN_CFG.moderate) : null;
    const snowCfg = isSnow ? (SNOW_CFG[effect.density] ?? SNOW_CFG.gentle) : null;

    const setup = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w;
      canvas.height = h;
      if (isRain) {
        loopRef.current.particles = Array.from(
          { length: rainCfg.count },
          () => makeRainDrop(rainCfg, w, h, true),
        );
      } else if (isSnow) {
        loopRef.current.particles = Array.from(
          { length: snowCfg.count },
          () => makeSnowFlake(snowCfg, w, h, true),
        );
      }
    };

    setup();

    const ro = new ResizeObserver(setup);
    ro.observe(canvas.parentElement);

    let prev = performance.now();
    const tick = (now) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      const loop = loopRef.current;
      loop.t += dt;
      const { particles, t } = loop;
      const w = canvas.width;
      const h = canvas.height;
      if (particles) {
        if (isRain) drawRain(ctx, particles, rainCfg, w, h, dt);
        if (isSnow) drawSnow(ctx, particles, snowCfg, w, h, t, dt);
      }
      loop.animId = requestAnimationFrame(tick);
    };

    loopRef.current.animId = requestAnimationFrame(tick);
    const capturedLoop = loopRef.current;

    return () => {
      cancelAnimationFrame(capturedLoop.animId);
      ro.disconnect();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [effect]);

  if (!effect) return null;

  return (
    <div
      className={`weather-effects weather-effects--${effect.type} weather-effects--${effect.density}`}
      aria-hidden="true"
    >
      {effect.type !== 'fog' && (
        <canvas ref={canvasRef} className="weather-effects-canvas" />
      )}

      {effect.type === 'fog' && (
        <>
          <div className="weather-effects-fog-layer" />
          <div className="weather-effects-fog-layer weather-effects-fog-layer--2" />
          <div className="weather-effects-fog-layer weather-effects-fog-layer--3" />
        </>
      )}

      {effect.type === 'thunder' && (
        <div className="weather-effects-lightning" />
      )}
    </div>
  );
};


export default WeatherEffects;
