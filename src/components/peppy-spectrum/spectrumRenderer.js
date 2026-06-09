/**
 * PeppySpectrum canvas rendering engine.
 *
 * Renders frequency spectrum bars using PeppyMeter-style image assets.
 * Layers: screen background → meter background → bars → reflections → toppings → foreground.
 */

/**
 * Parse a PeppySpectrum gradient string like "(r,g,b)(r,g,b)" into an array of CSS color strings.
 * Stops are distributed evenly from 0 to 1.
 *
 * @param {string} gradStr
 * @returns {{ pos: number, color: string }[]}
 */
function parseGradientStops(gradStr) {
  const stops = [];
  const re = /\((\d+),(\d+),(\d+)\)/g;
  let match;
  while ((match = re.exec(gradStr)) !== null) {
    stops.push(`rgb(${match[1]},${match[2]},${match[3]})`);
  }
  if (stops.length === 0) return [];
  return stops.map((color, i) => ({
    pos: stops.length === 1 ? 0 : i / (stops.length - 1),
    color,
  }));
}

/**
 * Create a vertical canvas linear gradient from bottom y0 to top y1.
 * First gradient stop = bottom, last = top (matching PeppySpectrum bar direction).
 */
function makeBarGradient(ctx, gradStr, x, y0, y1) {
  const stops = parseGradientStops(gradStr);
  if (stops.length === 0) return null;
  const grad = ctx.createLinearGradient(x, y0, x, y1);
  for (const { pos, color } of stops) grad.addColorStop(pos, color);
  return grad;
}

/**
 * Load an image and return a promise. Returns null for empty filenames.
 */
export function loadImage(src) {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Load all images needed for a spectrum config.
 *
 * @param {Object} config — normalized spectrum config
 * @param {string} basePath — URL prefix for image files
 * @returns {Promise<Object>} { bgr, bar, reflection, fgr }
 */
export async function loadSpectrumImages(config, basePath) {
  const prefix = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const [bgr, bar, reflection, fgr] = await Promise.all([
    loadImage(config.bgrFilename ? `${prefix}${config.bgrFilename}` : ''),
    loadImage(config.barFilename ? `${prefix}${config.barFilename}` : ''),
    loadImage(config.reflectionFilename ? `${prefix}${config.reflectionFilename}` : ''),
    loadImage(config.fgrFilename ? `${prefix}${config.fgrFilename}` : ''),
  ]);
  return { bgr, bar, reflection, fgr };
}

/**
 * Render a complete PeppySpectrum frame onto a canvas.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} config — normalized spectrum config
 * @param {Object} images — { bgr, bar, reflection, fgr }
 * @param {Float32Array|Uint8Array} fftData — frequency bin magnitudes (0–255 Uint8 or 0–1 float)
 * @param {Float32Array|null} toppings — current topping (peak) positions per bar (0–1)
 * @param {number} canvasW — canvas pixel width
 * @param {number} canvasH — canvas pixel height
 * @param {number} nativeW — native width from folder name
 * @param {number} nativeH — native height from folder name
 * @param {number} numBars — number of frequency bars to render
 * @param {{ w: number, h: number }|null} [clipSize] — optional clip dimensions for embedded use
 */
export function renderSpectrumFrame(
  ctx,
  config,
  images,
  fftData,
  toppings,
  canvasW,
  canvasH,
  nativeW,
  nativeH,
  numBars,
  clipSize,
) {
  const scaleX = canvasW / nativeW;
  const scaleY = canvasH / nativeH;

  // Spectrum area offset (for embedded use, or full-screen packs)
  const specX = (config.spectrumX || 0) * scaleX;
  const specY = (config.spectrumY || 0) * scaleY;
  const hasOffset = config.spectrumX > 0 || config.spectrumY > 0;

  // Clear
  ctx.clearRect(0, 0, canvasW, canvasH);

  // Determine clip area for embedded spectrum to prevent overflow
  let clipped = false;
  if (clipSize) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(specX, specY, clipSize.w * scaleX, clipSize.h * scaleY);
    ctx.clip();
    clipped = true;
  } else if (hasOffset && images.bgr) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(specX, specY, images.bgr.width * scaleX, images.bgr.height * scaleY);
    ctx.clip();
    clipped = true;
  }

  // Layer 1: Background
  if (images.bgr) {
    if (hasOffset) {
      // Embedded: draw bgr at spectrum area position with natural dimensions
      ctx.drawImage(images.bgr, specX, specY, images.bgr.width * scaleX, images.bgr.height * scaleY);
    } else {
      // Standalone: stretch to fill canvas (original behavior)
      ctx.drawImage(images.bgr, 0, 0, canvasW, canvasH);
    }
  } else if (config.bgrType === 'color' && config.bgrColor) {
    ctx.fillStyle = `rgb(${config.bgrColor})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else if (config.bgrType === 'gradient' && config.bgrGradient) {
    const grad = ctx.createLinearGradient(0, 0, canvasW, 0);
    const stops = parseGradientStops(config.bgrGradient);
    for (const { pos, color } of stops) grad.addColorStop(pos, color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // Bar rendering parameters
  const barW = config.barWidth * scaleX;
  const barH = config.barHeight * scaleY;
  const gap = config.barGap * scaleX;
  const originX = specX + config.originX * scaleX;
  const originY = specY + config.originY * scaleY;
  const isExtended = config.barType === 'image.extended';
  const steps = config.steps || 20;
  const stepSize = barH / steps;

  // Draw bars
  for (let i = 0; i < numBars; i++) {
    const value = fftData[i] !== undefined ? fftData[i] / 255 : 0;
    const x = originX + i * (barW + gap);

    // Quantize to steps (matching PeppySpectrum behavior)
    const numSteps = Math.ceil(value * steps);
    const fillH = numSteps * stepSize;

    if (fillH <= 0) continue;

    if (images.bar) {
      if (isExtended) {
        // image.extended: reveal from bottom proportional to quantized level
        const ratio = fillH / barH;
        const srcH = ratio * images.bar.height;
        const srcY = images.bar.height - srcH;
        ctx.drawImage(
          images.bar,
          0, srcY, images.bar.width, srcH,
          x, originY - fillH, barW, fillH,
        );
      } else {
        // image: stretch the bar image to fill height
        ctx.drawImage(images.bar, x, originY - fillH, barW, fillH);
      }
    } else if (config.barGradient) {
      // gradient: first stop = bottom (origin), last stop = top (full bar height)
      const grad = makeBarGradient(ctx, config.barGradient, x, originY, originY - barH);
      ctx.fillStyle = grad || '#ffffff';
      ctx.fillRect(x, originY - fillH, barW, fillH);
    } else if (config.barColor) {
      ctx.fillStyle = `rgb(${config.barColor})`;
      ctx.fillRect(x, originY - fillH, barW, fillH);
    }

    // Reflection (same height as bar, drawn below origin)
    if (images.reflection && config.reflectionType) {
      const refGap = (config.reflectionGap || 0) * scaleY;
      const refY = originY + refGap;
      const refH = fillH;

      if (config.reflectionType === 'image.extended') {
        const ratio = fillH / barH;
        const srcH = ratio * images.reflection.height;
        ctx.drawImage(
          images.reflection,
          0, 0, images.reflection.width, srcH,
          x, refY, barW, refH,
        );
      } else if (config.reflectionType === 'image') {
        ctx.drawImage(images.reflection, x, refY, barW, refH);
      }
    }

    // Topping (peak indicator)
    if (toppings && toppings[i] > 0) {
      const toppingY = originY - (toppings[i] * barH);
      const toppingH = config.toppingHeight * scaleY;
      if (images.bar) {
        // Use a slice of the bar image for the topping
        ctx.drawImage(
          images.bar,
          0, 0, images.bar.width, config.toppingHeight,
          x, toppingY - toppingH, barW, toppingH,
        );
      } else if (config.barGradient) {
        // Use the top-most gradient color for the topping
        const stops = parseGradientStops(config.barGradient);
        ctx.fillStyle = stops.length > 0 ? stops[stops.length - 1].color : '#ffffff';
        ctx.fillRect(x, toppingY - toppingH, barW, toppingH);
      } else {
        ctx.fillStyle = config.barColor ? `rgb(${config.barColor})` : '#ffffff';
        ctx.fillRect(x, toppingY - toppingH, barW, toppingH);
      }
    }
  }

  // Layer: Foreground overlay
  if (images.fgr) {
    if (hasOffset) {
      ctx.drawImage(images.fgr, specX, specY, images.fgr.width * scaleX, images.fgr.height * scaleY);
    } else {
      ctx.drawImage(images.fgr, 0, 0, canvasW, canvasH);
    }
  }

  // Restore clip state
  if (clipped) {
    ctx.restore();
  }
}
