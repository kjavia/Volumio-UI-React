/**
 * Parse a PeppySpectrum spectrum.txt file into a map of spectrum config objects.
 *
 * The file format is INI-like:
 *   [SectionName]
 *   key = value
 *
 * @param {string} text — raw spectrum.txt content
 * @returns {Object<string, Object>} map of spectrum name → raw config
 */
export function parseSpectrumConfig(text) {
  const spectrums = {};
  let current = null;

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const sectionMatch = line.match(/^\[(.+)\]$/);
    if (sectionMatch) {
      current = sectionMatch[1];
      spectrums[current] = {};
      continue;
    }

    if (current) {
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim();
      spectrums[current][key] = val;
    }
  }

  return spectrums;
}

/**
 * Normalize a raw parsed spectrum config into a typed config.
 *
 * @param {Object} raw — key/value pairs from parseSpectrumConfig
 * @returns {Object} typed spectrum configuration
 */
export function normalizeSpectrumConfig(raw) {
  const num = (key, fallback = 0) => {
    const v = raw[key];
    if (v === undefined || v === '') return fallback;
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  };
  const str = (key, fallback = '') => (raw[key] ?? '').trim() || fallback;

  return {
    originX: num('origin.x', 0),
    originY: num('origin.y', 0),
    spectrumX: num('spectrum.x', 0),
    spectrumY: num('spectrum.y', 0),

    bgrType: str('bgr.type', 'image'),
    bgrColor: str('bgr.color'),
    bgrGradient: str('bgr.gradient'),
    bgrFilename: str('bgr.filename'),

    barType: str('bar.type', 'image'),
    barColor: str('bar.color'),
    barGradient: str('bar.gradient'),
    barFilename: str('bar.filename'),
    barWidth: num('bar.width', 20),
    barHeight: num('bar.height', 200),
    barGap: num('bar.gap', 5),

    reflectionType: str('reflection.type'),
    reflectionColor: str('reflection.color'),
    reflectionGradient: str('reflection.gradient'),
    reflectionFilename: str('reflection.filename'),
    reflectionGap: num('reflection.gap', 0),

    fgrFilename: str('fgr.filename'),
    steps: num('steps', 25),

    toppingHeight: num('topping.height', 3),
    toppingStep: num('topping.step', 3),
  };
}

/**
 * Fetch and parse a spectrum.txt file.
 *
 * @param {string} url — URL to the spectrum.txt file
 * @returns {Promise<Object<string, Object>>} map of spectrum name → normalized config
 */
export async function fetchSpectrumConfigs(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch spectrum.txt: ${res.status}`);
  const text = await res.text();
  const raw = parseSpectrumConfig(text);

  const configs = {};
  for (const [name, cfg] of Object.entries(raw)) {
    configs[name] = normalizeSpectrumConfig(cfg);
  }
  return configs;
}
