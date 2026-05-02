/**
 * Parse a PeppyMeter meters.txt file into an array of meter config objects.
 *
 * The file format is INI-like:
 *   [SectionName]
 *   key = value
 *   key = value
 *
 * Lines starting with # are comments. Blank lines are ignored.
 *
 * @param {string} text — raw meters.txt content
 * @returns {Object<string, Object>} map of meter name → config
 */
export function parseMeterConfig(text) {
  const meters = {};
  let current = null;

  for (const raw of text.split('\n')) {
    const line = raw.trim();

    // Skip blanks and comments
    if (!line || line.startsWith('#')) continue;

    // Section header: [name]
    const sectionMatch = line.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      current = sectionMatch[1];
      meters[current] = {};
      continue;
    }

    // Key = value pairs
    if (current) {
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim();
      meters[current][key] = val;
    }
  }

  return meters;
}

/**
 * Parse a position string like "132,418,bold" → { x, y, fontWeight }
 */
function parsePos(val) {
  if (!val) return null;
  const parts = val.split(',').map((s) => s.trim());
  if (parts.length < 2) return null;
  const x = parseInt(parts[0], 10);
  const y = parseInt(parts[1], 10);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  return { x, y, fontWeight: parts[2] || 'regular' };
}

/**
 * Parse a color string like "0,0,0" → "rgb(0,0,0)"
 */
function parseColor(val) {
  if (!val) return null;
  const parts = val.split(',').map((s) => parseInt(s.trim(), 10));
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;
  return `rgb(${parts[0]},${parts[1]},${parts[2]})`;
}

/**
 * Parse a dimension string like "95,95" → { w, h }
 */
function parseDimension(val) {
  if (!val) return null;
  const parts = val.split(',').map((s) => parseInt(s.trim(), 10));
  if (parts.length < 2 || parts.some(Number.isNaN)) return null;
  return { w: parts[0], h: parts[1] };
}

/**
 * Convert a raw parsed meter config object into a typed config
 * with numeric values and sensible defaults.
 *
 * @param {Object} raw — key/value pairs from parseMeterConfig
 * @returns {Object} typed meter configuration
 */
export function normalizeMeterConfig(raw) {
  const num = (key, fallback = 0) => {
    const v = raw[key];
    if (v === undefined || v === '') return fallback;
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  };

  const str = (key, fallback = '') => (raw[key] ?? '').trim() || fallback;

  const type = str('meter.type', 'circular');

  const configExtend = str('config.extend', 'False') === 'True';

  const meterVisible = str('meter.visible', 'True') === 'True';

  // Embedded spectrum config (rendered on top of meter)
  const spectrumVisible = str('spectrum.visible', 'False') === 'True';
  const spectrumName = str('spectrum.name') || null;
  const spectrumSize = parseDimension(raw['spectrum.size']);

  const base = {
    type,
    channels: num('channels', 2),
    refreshPeriod: num('ui.refresh.period', 0.033),
    bgrFilename: str('bgr.filename'),
    fgrFilename: str('fgr.filename'),
    indicatorFilename: str('indicator.filename'),
    meterX: num('meter.x', 0),
    meterY: num('meter.y', 0),
    screenBgr: str('screen.bgr'),
    configExtend,
    meterVisible,
    spectrumVisible,
    spectrumName,
    spectrumSize,
  };

  // ── Extended config (reel, playinfo, progress, volume, icons, etc.) ──

  if (configExtend) {
    // Reel-to-reel
    base.reel = {
      left: {
        filename: str('reel.left.filename'),
        pos: parsePos(raw['reel.left.pos']),
        center: parsePos(raw['reel.left.center']),
      },
      right: {
        filename: str('reel.right.filename'),
        pos: parsePos(raw['reel.right.pos']),
        center: parsePos(raw['reel.right.center']),
      },
      rotationSpeed: num('reel.rotation.speed', 25),
    };

    // Album art
    base.albumArt = {
      pos: parsePos(raw['albumart.pos']),
      dimension: parseDimension(raw['albumart.dimension']),
      border: num('albumart.border', 0),
      rotation: str('albumart.rotation', 'False').toLowerCase() === 'true',
      rotationSpeed: num('albumart.rotation.speed', 33),
      mask: str('albumart.mask'),
    };

    // Vinyl disc
    base.vinyl = {
      filename: str('vinyl.filename'),
      pos: parsePos(raw['vinyl.pos']),
      center: parsePos(raw['vinyl.center']),
      dimension: parseDimension(raw['vinyl.dimension']),
      direction: str('vinyl.direction', 'cw'),
    };

    // Tonearm
    base.tonearm = {
      filename: str('tonearm.filename'),
      pivotScreen: parsePos(raw['tonearm.pivot.screen']),
      pivotImage: parsePos(raw['tonearm.pivot.image']),
      angleRest: num('tonearm.angle.rest', 0),
      angleStart: num('tonearm.angle.start', -15),
      angleEnd: num('tonearm.angle.end', -40),
      dropDuration: num('tonearm.drop.duration', 1.5),
      liftDuration: num('tonearm.lift.duration', 1.0),
    };

    // Play info
    base.playInfo = {
      title: { pos: parsePos(raw['playinfo.title.pos']), maxWidth: num('playinfo.title.maxwidth', 0), color: parseColor(raw['playinfo.title.color']) },
      artist: { pos: parsePos(raw['playinfo.artist.pos']), maxWidth: num('playinfo.artist.maxwidth', 0), color: parseColor(raw['playinfo.artist.color']) },
      album: { pos: parsePos(raw['playinfo.album.pos']), maxWidth: num('playinfo.album.maxwidth', 0), color: parseColor(raw['playinfo.album.color']) },
      center: str('playinfo.center', 'False') === 'True',
      type: {
        pos: parsePos(raw['playinfo.type.pos']),
        color: parseColor(raw['playinfo.type.color']),
        dimension: parseDimension(raw['playinfo.type.dimension']),
      },
      samplerate: { pos: parsePos(raw['playinfo.samplerate.pos']), maxWidth: num('playinfo.samplerate.maxwidth', 0) },
      next: {
        title: { pos: parsePos(raw['playinfo.next.title.pos']), maxWidth: num('playinfo.next.title.maxwidth', 0), color: parseColor(raw['playinfo.next.title.color']) },
        artist: { pos: parsePos(raw['playinfo.next.artist.pos']), maxWidth: num('playinfo.next.artist.maxwidth', 0), color: parseColor(raw['playinfo.next.artist.color']) },
        album: { pos: parsePos(raw['playinfo.next.album.pos']), maxWidth: num('playinfo.next.album.maxwidth', 0), color: parseColor(raw['playinfo.next.album.color']) },
      },
    };

    // Ticker (scrolling text)
    base.ticker = {
      enabled: str('playinfo.ticker', 'False') === 'True',
      replace: str('playinfo.ticker.replace', 'False') === 'True',
      direction: str('playinfo.ticker.direction', 'ltr'),
      appendNext: str('playinfo.ticker.append_next', 'False') === 'True',
      pos: parsePos(raw['playinfo.ticker.pos']),
      color: parseColor(raw['playinfo.ticker.color']),
      maxWidth: num('playinfo.ticker.maxwidth', 0),
      speed: num('playinfo.ticker.speed', 40),
      separator: str('playinfo.ticker.separator', ' • '),
      spaceBetween: num('playinfo.ticker.space_between', 4),
      endSpaces: num('playinfo.ticker.end_spaces', 6),
    };

    // Time displays
    base.time = {
      remaining: {
        pos: parsePos(raw['time.remaining.pos']),
        color: parseColor(raw['time.remaining.color']),
        font: str('time.remaining.font'),
        fontSize: num('time.remaining.fontsize', 0),
      },
      elapsed: {
        pos: parsePos(raw['time.elapsed.pos']),
        color: parseColor(raw['time.elapsed.color']),
        font: str('time.elapsed.font'),
        fontSize: num('time.elapsed.fontsize', 0),
      },
      total: {
        pos: parsePos(raw['time.total.pos']),
        color: parseColor(raw['time.total.color']),
        font: str('time.total.font'),
        fontSize: num('time.total.fontsize', 0),
      },
    };

    // Progress bar
    base.progress = {
      pos: parsePos(raw['progress.pos']),
      dim: parseDimension(raw['progress.dim']),
      color: parseColor(raw['progress.color']),
      bgColor: parseColor(raw['progress.bg.color']),
      border: num('progress.border', 0),
      borderColor: parseColor(raw['progress.border.color']),
      style: str('progress.style', 'bar'),
      sliderOrientation: str('progress.slider.orientation', 'horizontal'),
      arcWidth: num('progress.arc.width', 6),
      arcAngleStart: num('progress.arc.angle.start', 90),
      arcAngleEnd: num('progress.arc.angle.end', -270),
      headImage: str('progress.head.image'),
      headOffset: parsePos(raw['progress.head.offset']),
    };

    // Volume indicator
    base.volume = {
      pos: parsePos(raw['volume.pos']),
      dim: parseDimension(raw['volume.dim']),
      color: parseColor(raw['volume.color']),
      bgColor: parseColor(raw['volume.bg.color']),
      style: str('volume.style', 'slider'),
      sliderOrientation: str('volume.slider.orientation', 'horizontal'),
      sliderTrack: str('volume.slider.track'),
      sliderTip: str('volume.slider.tip'),
      sliderTravel: str('volume.slider.travel'),
      sliderTipOffset: str('volume.slider.tip.offset'),
    };

    // Playback state icons (stop, pause, play)
    base.playstate = {
      pos: parsePos(raw['playstate.pos']),
      icon: str('playstate.icon'),
      glow: num('playstate.icon.glow', 0),
      glowIntensity: num('playstate.icon.glow.intensity', 0),
    };

    // Mute icon
    base.mute = {
      pos: parsePos(raw['mute.pos']),
      icon: str('mute.icon'),
      glow: num('mute.icon.glow', 0),
      glowIntensity: num('mute.icon.glow.intensity', 0),
      glowColor: str('mute.icon.glow.color'),
    };

    // Repeat icon
    base.repeat = {
      pos: parsePos(raw['repeat.pos']),
      icon: str('repeat.icon'),
      glow: num('repeat.icon.glow', 0),
      glowIntensity: num('repeat.icon.glow.intensity', 0),
    };

    // Shuffle icon
    base.shuffle = {
      pos: parsePos(raw['shuffle.pos']),
      icon: str('shuffle.icon'),
      glow: num('shuffle.icon.glow', 0),
      glowIntensity: num('shuffle.icon.glow.intensity', 0),
    };

    // Font settings
    base.font = {
      sizeDigi: num('font.size.digi', 30),
      sizeLight: num('font.size.light', 16),
      sizeRegular: num('font.size.regular', 23),
      sizeBold: num('font.size.bold', 37),
      color: parseColor(raw['font.color']),
    };
  }

  if (type === 'circular') {
    return {
      ...base,
      stepsPerDegree: num('steps.per.degree', 2),
      startAngle: num('start.angle', 45),
      stopAngle: num('stop.angle', -45),
      distance: num('distance', 200),
      leftOriginX: num('left.origin.x', 320),
      leftOriginY: num('left.origin.y', 400),
      rightOriginX: num('right.origin.x', 960),
      rightOriginY: num('right.origin.y', 400),
      leftStartAngle: num('left.start.angle', NaN),
      leftStopAngle: num('left.stop.angle', NaN),
      rightStartAngle: num('right.start.angle', NaN),
      rightStopAngle: num('right.stop.angle', NaN),
      leftNeedleFlip: str('left.needle.flip', 'False') === 'True',
      rightNeedleFlip: str('right.needle.flip', 'False') === 'True',
    };
  }

  // Linear
  return {
    ...base,
    indicatorType: str('indicator.type', 'default'),
    leftX: num('left.x', 0),
    leftY: num('left.y', 0),
    rightX: num('right.x', 0),
    rightY: num('right.y', 0),
    positionRegular: num('position.regular', 100),
    stepWidthRegular: num('step.width.regular', 1),
    positionOverload: num('position.overload', 0),
    stepWidthOverload: num('step.width.overload', 1),
    direction: str('direction', 'left-right'),
    flipLeftX: str('flip.left.x', 'False') === 'True',
  };
}

/**
 * Fetch and parse a meters.txt file.
 *
 * @param {string} url — URL to the meters.txt file
 * @returns {Promise<Object<string, Object>>} map of meter name → normalized config
 */
export async function fetchMeterConfigs(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch meters.txt: ${res.status}`);
  const text = await res.text();
  const raw = parseMeterConfig(text);

  const configs = {};
  for (const [name, cfg] of Object.entries(raw)) {
    configs[name] = normalizeMeterConfig(cfg);
  }
  return configs;
}
