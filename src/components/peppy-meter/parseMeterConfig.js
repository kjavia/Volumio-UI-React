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
