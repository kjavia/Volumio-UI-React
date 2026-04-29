/**
 * PeppyMeter canvas rendering engine.
 *
 * Handles both circular (needle) and linear (indicator) meter types.
 * Images are composited in layers: screen background → meter background →
 * needle/indicator → meter foreground.
 */

/**
 * Load an image and return a promise that resolves to the HTMLImageElement.
 * Returns null for empty/missing filenames.
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
 * Load all images needed for a meter.
 *
 * @param {Object} config — normalized meter config
 * @param {string} basePath — URL prefix for image files
 * @returns {Promise<Object>} { bgr, fgr, indicator, screenBgr }
 */
export async function loadMeterImages(config, basePath) {
  const prefix = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const [bgr, fgr, indicator, screenBgr] = await Promise.all([
    loadImage(config.bgrFilename ? `${prefix}${config.bgrFilename}` : ''),
    loadImage(config.fgrFilename ? `${prefix}${config.fgrFilename}` : ''),
    loadImage(config.indicatorFilename ? `${prefix}${config.indicatorFilename}` : ''),
    loadImage(config.screenBgr ? `${prefix}${config.screenBgr}` : ''),
  ]);
  return { bgr, fgr, indicator, screenBgr };
}

// ── Circular meter rendering ────────────────────────────────────────────────

/**
 * Draw a rotated needle on a canvas 2D context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} needle — needle/indicator image
 * @param {number} originX — pivot point X (in canvas pixels)
 * @param {number} originY — pivot point Y (in canvas pixels)
 * @param {number} angleDeg — current rotation angle in degrees
 * @param {number} distance — distance from origin to needle center
 * @param {boolean} flip — horizontally flip the needle
 * @param {number} scaleX — horizontal scale factor for rendering
 * @param {number} scaleY — vertical scale factor for rendering
 */
export function drawCircularNeedle(
  ctx,
  needle,
  originX,
  originY,
  angleDeg,
  distance,
  flip = false,
  scaleX = 1,
  scaleY = 1,
) {
  if (!needle) return;

  const angleRad = (angleDeg * Math.PI) / 180;
  const nw = needle.width * scaleX;
  const nh = needle.height * scaleY;

  ctx.save();
  ctx.translate(originX, originY);
  ctx.rotate(-angleRad); // PeppyMeter uses positive = left, CSS convention
  if (flip) ctx.scale(-1, 1);
  // Draw the needle centred horizontally, with bottom at origin
  ctx.drawImage(needle, -nw / 2, -distance * scaleY - nh / 2, nw, nh);
  ctx.restore();
}

/**
 * Convert a volume (0–1) to an angle for a circular meter.
 *
 * @param {number} volume — 0..1 normalized volume
 * @param {number} startAngle — angle at volume = 0 (degrees)
 * @param {number} stopAngle — angle at volume = 1 (degrees)
 * @returns {number} interpolated angle in degrees
 */
export function volumeToAngle(volume, startAngle, stopAngle) {
  const clamped = Math.max(0, Math.min(1, volume));
  return startAngle + clamped * (stopAngle - startAngle);
}

// ── Linear meter rendering ──────────────────────────────────────────────────

/**
 * Draw a linear indicator on a canvas.
 *
 * For indicator.type = 'single', the needle image is positioned
 * proportional to the volume along the travel distance.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} indicator — indicator image
 * @param {number} volume — 0..1 normalized volume
 * @param {Object} config — normalized linear meter config fields
 * @param {number} x — base X position
 * @param {number} y — base Y position
 * @param {number} scaleX — horizontal scale
 * @param {number} scaleY — vertical scale
 */
export function drawLinearIndicator(
  ctx,
  indicator,
  volume,
  config,
  x,
  y,
  scaleX = 1,
  scaleY = 1,
) {
  if (!indicator) return;

  const clamped = Math.max(0, Math.min(1, volume));
  const totalTravel = config.positionRegular * config.stepWidthRegular;
  const isSingle = config.indicatorType === 'single';
  const iw = indicator.width * scaleX;
  const ih = indicator.height * scaleY;

  if (isSingle) {
    // Move the indicator image along the direction axis
    const offset = clamped * totalTravel * scaleX;
    const dir = config.direction || 'left-right';
    let dx = x * scaleX;
    let dy = y * scaleY;

    switch (dir) {
      case 'left-right':
        dx += offset;
        break;
      case 'right-left':
        dx += totalTravel * scaleX - offset;
        break;
      case 'top-bottom':
        dy += offset;
        break;
      case 'bottom-top':
        dy += totalTravel * scaleY - offset;
        break;
      default:
        dx += offset;
    }

    ctx.drawImage(indicator, dx, dy, iw, ih);
  } else {
    // Mask-style: reveal indicator proportional to volume
    const revealWidth = clamped * totalTravel * scaleX;
    if (revealWidth <= 0) return;
    ctx.drawImage(
      indicator,
      0, 0, revealWidth / scaleX, indicator.height,
      x * scaleX, y * scaleY, revealWidth, ih,
    );
  }
}

// ── Full-frame compositing ──────────────────────────────────────────────────

/**
 * Render a complete PeppyMeter frame onto a canvas.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} config — normalized meter config
 * @param {Object} images — { bgr, fgr, indicator, screenBgr }
 * @param {number} volumeL — left channel 0..1
 * @param {number} volumeR — right channel 0..1
 * @param {number} canvasW — canvas pixel width
 * @param {number} canvasH — canvas pixel height
 * @param {number} nativeW — native meter width (from folder name)
 * @param {number} nativeH — native meter height (from folder name)
 */
export function renderMeterFrame(
  ctx,
  config,
  images,
  volumeL,
  volumeR,
  canvasW,
  canvasH,
  nativeW,
  nativeH,
) {
  const scaleX = canvasW / nativeW;
  const scaleY = canvasH / nativeH;

  // Clear
  ctx.clearRect(0, 0, canvasW, canvasH);

  // Layer 1: Screen background (optional full-bleed image)
  if (images.screenBgr) {
    ctx.drawImage(images.screenBgr, 0, 0, canvasW, canvasH);
  }

  // Layer 2: Meter background
  if (images.bgr) {
    ctx.drawImage(
      images.bgr,
      config.meterX * scaleX,
      config.meterY * scaleY,
      images.bgr.width * scaleX,
      images.bgr.height * scaleY,
    );
  }

  // Layer 3: Needle / indicator
  if (config.type === 'circular') {
    const leftStart = Number.isNaN(config.leftStartAngle)
      ? config.startAngle
      : config.leftStartAngle;
    const leftStop = Number.isNaN(config.leftStopAngle)
      ? config.stopAngle
      : config.leftStopAngle;
    const rightStart = Number.isNaN(config.rightStartAngle)
      ? config.startAngle
      : config.rightStartAngle;
    const rightStop = Number.isNaN(config.rightStopAngle)
      ? config.stopAngle
      : config.rightStopAngle;

    // Left channel needle
    const angleL = volumeToAngle(volumeL, leftStart, leftStop);
    drawCircularNeedle(
      ctx,
      images.indicator,
      config.leftOriginX * scaleX,
      config.leftOriginY * scaleY,
      angleL,
      config.distance,
      config.leftNeedleFlip,
      scaleX,
      scaleY,
    );

    // Right channel needle (if stereo)
    if (config.channels >= 2) {
      const angleR = volumeToAngle(volumeR, rightStart, rightStop);
      drawCircularNeedle(
        ctx,
        images.indicator,
        config.rightOriginX * scaleX,
        config.rightOriginY * scaleY,
        angleR,
        config.distance,
        config.rightNeedleFlip,
        scaleX,
        scaleY,
      );
    }
  } else {
    // Linear meter
    drawLinearIndicator(
      ctx,
      images.indicator,
      volumeL,
      config,
      config.leftX,
      config.leftY,
      scaleX,
      scaleY,
    );

    if (config.channels >= 2) {
      drawLinearIndicator(
        ctx,
        images.indicator,
        volumeR,
        config,
        config.rightX,
        config.rightY,
        scaleX,
        scaleY,
      );
    }
  }

  // Layer 4: Foreground overlay
  if (images.fgr) {
    ctx.drawImage(
      images.fgr,
      config.meterX * scaleX,
      config.meterY * scaleY,
      images.fgr.width * scaleX,
      images.fgr.height * scaleY,
    );
  }
}
