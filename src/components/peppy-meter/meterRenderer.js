/**
 * PeppyMeter canvas rendering engine.
 *
 * Handles both circular (needle) and linear (indicator) meter types.
 * Images are composited in layers: screen background → meter background →
 * needle/indicator → meter foreground.
 */

/**
 * Convert a fully-opaque mask image to a proper alpha mask.
 * JPEG and alpha-less PNG masks have alpha=255 everywhere, so canvas
 * `source-in` compositing lets everything through. This detects that case
 * and converts inverted luminance → alpha (black = opaque, white = transparent).
 * PNGs with genuine transparency are left untouched.
 */
function ensureAlphaMask(offCtx, w, h) {
  const imgData = offCtx.getImageData(0, 0, w, h);
  const d = imgData.data;
  // Quick scan: if any pixel has alpha < 250, the image already has transparency
  let hasAlpha = false;
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] < 250) { hasAlpha = true; break; }
  }
  if (!hasAlpha) {
    // All pixels opaque — convert inverted luminance to alpha
    for (let i = 0; i < d.length; i += 4) {
      const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = 255 - lum;
    }
    offCtx.putImageData(imgData, 0, 0);
  }
}

// Ensure the bundled DS Digital font is always available for time displays
let _dsDigitalLoaded = false;
function ensureDigitalFont() {
  if (_dsDigitalLoaded) return;
  _dsDigitalLoaded = true;
  const face = new FontFace('DS Digital', 'url(/assets/fonts/DS-DIGI.TTF)');
  face.load().then((f) => document.fonts.add(f)).catch(() => {});
}

/**
 * Load an image and return a promise that resolves to the HTMLImageElement.
 * Returns null for empty/missing filenames.
 */
export function loadImage(src) {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
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
 * @param {string} [albumArtUrl] — URL for current track's album art
 * @returns {Promise<Object>} { bgr, fgr, indicator, screenBgr, albumArt, albumArtMask }
 */
export async function loadMeterImages(config, basePath) {
  ensureDigitalFont();
  const prefix = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const loads = [
    loadImage(config.bgrFilename ? `${prefix}${config.bgrFilename}` : ''),
    loadImage(config.fgrFilename ? `${prefix}${config.fgrFilename}` : ''),
    loadImage(config.indicatorFilename ? `${prefix}${config.indicatorFilename}` : ''),
    loadImage(config.screenBgr ? `${prefix}${config.screenBgr}` : ''),
  ];

  // Extended: reel images
  if (config.reel) {
    loads.push(loadImage(config.reel.left.filename ? `${prefix}${config.reel.left.filename}` : ''));
    loads.push(loadImage(config.reel.right.filename ? `${prefix}${config.reel.right.filename}` : ''));
  } else {
    loads.push(Promise.resolve(null), Promise.resolve(null));
  }

  // Extended: playstate icons [stop, pause, play]
  if (config.playstate?.icon) {
    const icons = config.playstate.icon.split(',').map((f) => loadImage(f.trim() ? `${prefix}${f.trim()}` : ''));
    loads.push(Promise.all(icons));
  } else {
    loads.push(Promise.resolve(null));
  }

  // Extended: mute icons [muted, unmuted]
  if (config.mute?.icon) {
    const icons = config.mute.icon.split(',').map((f) => loadImage(f.trim() ? `${prefix}${f.trim()}` : ''));
    loads.push(Promise.all(icons));
  } else {
    loads.push(Promise.resolve(null));
  }

  // Extended: repeat icons [off, all, single]
  if (config.repeat?.icon) {
    const icons = config.repeat.icon.split(',').map((f) => loadImage(f.trim() ? `${prefix}${f.trim()}` : ''));
    loads.push(Promise.all(icons));
  } else {
    loads.push(Promise.resolve(null));
  }

  // Extended: shuffle icons [off, on, infinity]
  if (config.shuffle?.icon) {
    const icons = config.shuffle.icon.split(',').map((f) => loadImage(f.trim() ? `${prefix}${f.trim()}` : ''));
    loads.push(Promise.all(icons));
  } else {
    loads.push(Promise.resolve(null));
  }

  // Extended: vinyl disc images (may be comma-separated: "cdart.png,vinyl.png")
  if (config.vinyl?.filename) {
    const vinylFiles = config.vinyl.filename.split(',').map((f) => f.trim()).filter(Boolean);
    const files = vinylFiles.map((f, idx) => {
      // CD art mask should come from track folder when available, not meter pack.
      if (idx === 0 && /^cdart\.(png|jpe?g|webp)$/i.test(f)) {
        return Promise.resolve(null);
      }
      return loadImage(`${prefix}${f}`);
    });
    loads.push(Promise.all(files));
  } else {
    loads.push(Promise.resolve(null));
  }

  // Extended: tonearm image
  loads.push(loadImage(config.tonearm?.filename ? `${prefix}${config.tonearm.filename}` : ''));

  // Extended: album art mask
  loads.push(loadImage(config.albumArt?.mask ? `${prefix}${config.albumArt.mask}` : ''));

  // Extended: progress head image
  loads.push(loadImage(config.progress?.headImage ? `${prefix}${config.progress.headImage}` : ''));

  // Extended: volume slider tip image
  loads.push(loadImage(config.volume?.sliderTip ? `${prefix}${config.volume.sliderTip}` : ''));

  const [bgr, fgr, indicator, screenBgr, reelLeft, reelRight, playstateIcons, muteIcons, repeatIcons, shuffleIcons, vinylImages, tonearmImg, albumArtMask, progressHead, volumeSliderTip] = await Promise.all(loads);

  // Load custom fonts from the pack (e.g. fonts/MyDigi.ttf)
  const fonts = {};
  if (config.time) {
    const fontFiles = new Set();
    if (config.time.remaining?.font) fontFiles.add(config.time.remaining.font);
    if (config.time.elapsed?.font) fontFiles.add(config.time.elapsed.font);
    if (config.time.total?.font) fontFiles.add(config.time.total.font);
    for (const fontPath of fontFiles) {
      const family = `peppy-${fontPath.replace(/[^a-zA-Z0-9]/g, '-')}`;
      try {
        const face = new FontFace(family, `url(${prefix}${fontPath})`);
        await face.load();
        document.fonts.add(face);
        fonts[fontPath] = family;
      } catch {
        // font load failed, will use fallback
      }
    }
  }

  return { bgr, fgr, indicator, screenBgr, reelLeft, reelRight, playstateIcons, muteIcons, repeatIcons, shuffleIcons, vinylImages, tonearmImg, albumArtMask, progressHead, volumeSliderTip, fonts };
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
 * @param {Object} images — { bgr, fgr, indicator, screenBgr, albumArt, albumArtMask }
 * @param {number} volumeL — left channel 0..1
 * @param {number} volumeR — right channel 0..1
 * @param {number} canvasW — canvas pixel width
 * @param {number} canvasH — canvas pixel height
 * @param {number} nativeW — native meter width (from folder name)
 * @param {number} nativeH — native meter height (from folder name)
 * @param {number} [reelAngle=0] — current reel rotation angle in degrees
 * @param {Object} [trackInfo=null] — current track metadata and playback state
 * @param {HTMLImageElement} [albumArt=null] — loaded album art image
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
  reelAngle = 0,
  trackInfo = null,
  albumArt = null,
  formatIcon = null,
  turntableState = null,
  fanartImage = null,
  cdartImage = null,
) {
  const scaleX = canvasW / nativeW;
  const scaleY = canvasH / nativeH;

  const drawFanartLayer = (targetZorder) => {
    if (!fanartImage || !config?.fanart?.pos || !config?.fanart?.dimension) return;
    const zorder = (config.fanart.zorder || 'background').toLowerCase();
    if (zorder !== targetZorder) return;

    const dx = config.fanart.pos.x * scaleX;
    const dy = config.fanart.pos.y * scaleY;
    const dw = config.fanart.dimension.w * scaleX;
    const dh = config.fanart.dimension.h * scaleY;
    const mode = (config.fanart.scale || 'fit').toLowerCase();

    if (mode === 'stretch') {
      ctx.drawImage(fanartImage, dx, dy, dw, dh);
      return;
    }

    // Default to fit/contain behavior.
    const iw = fanartImage.naturalWidth || fanartImage.width;
    const ih = fanartImage.naturalHeight || fanartImage.height;
    if (!iw || !ih) return;
    const ratio = Math.min(dw / iw, dh / ih);
    const rw = iw * ratio;
    const rh = ih * ratio;
    const ox = dx + (dw - rw) / 2;
    const oy = dy + (dh - rh) / 2;
    ctx.drawImage(fanartImage, ox, oy, rw, rh);
  };

  // Clear
  ctx.clearRect(0, 0, canvasW, canvasH);

  // Layer 1: Screen background (optional full-bleed image)
  if (images.screenBgr) {
    ctx.drawImage(images.screenBgr, 0, 0, canvasW, canvasH);
  }

  // Fanart background layer (if configured)
  drawFanartLayer('background');

  // Layers 2-4 only if meter is visible (meter.visible = True)
  if (config.meterVisible !== false) {
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

    // Layer 2.1: Vinyl disc rotation (turntable meters — drawn above bgr)
    if (config.vinyl?.filename && images.vinylImages && turntableState) {
      const vinylAngle = turntableState.vinylAngle || 0;
      const vinylPos = config.vinyl.pos;
      const vinylCenter = config.vinyl.center;
      const vinylDir = config.vinyl.direction === 'ccw' ? -1 : 1;
      const angleRad = (vinylAngle * vinylDir * Math.PI) / 180;

      // Vinyl images array: may be [cdart, vinyl_overlay] or [single_vinyl]
      const vinylImgs = images.vinylImages.filter(Boolean);
      if (vinylImgs.length > 0) {
        // Use explicit dimension from config, or image native size
        const baseVinyl = vinylImgs[vinylImgs.length - 1]; // last is the vinyl plate
        const dim = config.vinyl.dimension || { w: baseVinyl.width, h: baseVinyl.height };
        const vw = dim.w * scaleX;
        const vh = dim.h * scaleY;

        // Center of rotation (vinyl.center is in native screen coords)
        const cx = vinylCenter ? vinylCenter.x * scaleX : (vinylPos ? vinylPos.x * scaleX + vw / 2 : vw / 2);
        const cy = vinylCenter ? vinylCenter.y * scaleY : (vinylPos ? vinylPos.y * scaleY + vh / 2 : vh / 2);

        // Draw position (top-left of vinyl image in native coords)
        const dx = vinylPos ? vinylPos.x * scaleX : cx - vw / 2;
        const dy = vinylPos ? vinylPos.y * scaleY : cy - vh / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angleRad);

        const hasMask = !!(cdartImage || vinylImgs.length >= 2);
        if (hasMask && albumArt) {
          // Draw vinyl plate first (the disc texture)
          const vinyl = vinylImgs.length >= 2 ? vinylImgs[1] : vinylImgs[0];
          ctx.drawImage(vinyl, dx - cx, dy - cy, vw, vh);
          // Composite album art using cdart as mask via offscreen canvas
          const cdart = cdartImage || vinylImgs[0];
          const offscreen = document.createElement('canvas');
          offscreen.width = Math.round(vw);
          offscreen.height = Math.round(vh);
          const offCtx = offscreen.getContext('2d');
          // Draw cdart as the mask shape
          offCtx.drawImage(cdart, 0, 0, offscreen.width, offscreen.height);
          // Ensure cdart has proper alpha (handles JPEG / alpha-less PNG masks)
          ensureAlphaMask(offCtx, offscreen.width, offscreen.height);
          // Draw album art only where cdart has alpha
          offCtx.globalCompositeOperation = 'source-in';
          offCtx.drawImage(albumArt, 0, 0, offscreen.width, offscreen.height);
          // Composite onto main canvas
          ctx.drawImage(offscreen, dx - cx, dy - cy, vw, vh);
        } else {
          // Single vinyl image or vinyl plate without album art
          const plate = vinylImgs[vinylImgs.length - 1];
          ctx.drawImage(plate, dx - cx, dy - cy, vw, vh);
        }

        ctx.restore();
      }
    }

    // Layer 2.2: Rotating album art (turntable style with albumart.rotation = True)
    if (config.albumArt?.rotation && albumArt && config.albumArt?.pos && config.albumArt?.dimension && turntableState) {
      const artAngle = turntableState.vinylAngle || 0;
      const ax = config.albumArt.pos.x * scaleX;
      const ay = config.albumArt.pos.y * scaleY;
      const aw = config.albumArt.dimension.w * scaleX;
      const ah = config.albumArt.dimension.h * scaleY;
      const cx = ax + aw / 2;
      const cy = ay + ah / 2;
      const angleRad = (artAngle * Math.PI) / 180;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angleRad);

      if (images.albumArtMask) {
        // Use mask image for compositing (e.g. circular vinyl cutout)
        const offscreen = document.createElement('canvas');
        offscreen.width = Math.round(aw);
        offscreen.height = Math.round(ah);
        const offCtx = offscreen.getContext('2d');
        // Draw mask and ensure it has proper alpha (handles JPEG / alpha-less PNG)
        offCtx.drawImage(images.albumArtMask, 0, 0, offscreen.width, offscreen.height);
        ensureAlphaMask(offCtx, offscreen.width, offscreen.height);
        // Draw album art only where mask has alpha
        offCtx.globalCompositeOperation = 'source-in';
        offCtx.drawImage(albumArt, 0, 0, offscreen.width, offscreen.height);
        ctx.drawImage(offscreen, -aw / 2, -ah / 2, aw, ah);
      } else {
        // No mask — clip to circle
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(aw, ah) / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(albumArt, -aw / 2, -ah / 2, aw, ah);
      }

      ctx.restore();
    }

    // Layer 2.5: Rotating reels (between background and needles)
    if (config.reel && reelAngle !== 0) {
      const angleRad = (reelAngle * Math.PI) / 180;
      const drawReel = (img, reel) => {
        if (!img || !reel.center) return;
        const cx = reel.center.x * scaleX;
        const cy = reel.center.y * scaleY;
        const w = img.width * scaleX;
        const h = img.height * scaleY;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angleRad);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      };
      drawReel(images.reelLeft, config.reel.left);
      drawReel(images.reelRight, config.reel.right);
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
        (config.leftOriginX + config.meterX) * scaleX,
        (config.leftOriginY + config.meterY) * scaleY,
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
          (config.rightOriginX + config.meterX) * scaleX,
          (config.rightOriginY + config.meterY) * scaleY,
          angleR,
          config.distance,
          config.rightNeedleFlip,
          scaleX,
          scaleY,
        );
      }
    } else {
      // Linear meter — add meter.x/y offset (matching PeppyMeter: origin_x + left.x)
      drawLinearIndicator(
        ctx,
        images.indicator,
        volumeL,
        config,
        config.leftX + config.meterX,
        config.leftY + config.meterY,
        scaleX,
        scaleY,
      );

      if (config.channels >= 2) {
        drawLinearIndicator(
          ctx,
          images.indicator,
          volumeR,
          config,
          config.rightX + config.meterX,
          config.rightY + config.meterY,
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

  // Layer 5: Tonearm (drawn above foreground, animated by progress)
  if (config.tonearm?.filename && images.tonearmImg && turntableState) {
    const arm = config.tonearm;
    const tonearmAngle = turntableState.tonearmAngle != null ? turntableState.tonearmAngle : arm.angleRest;
    const pivotX = arm.pivotScreen.x * scaleX;
    const pivotY = arm.pivotScreen.y * scaleY;
    const imgPivotX = arm.pivotImage.x * scaleX;
    const imgPivotY = arm.pivotImage.y * scaleY;
    const angleRad = (tonearmAngle * Math.PI) / 180;
    const armW = images.tonearmImg.width * scaleX;
    const armH = images.tonearmImg.height * scaleY;

    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(-angleRad); // PeppyMeter uses positive = CCW (pygame convention)
    // Draw arm image with pivot point at the image's pivot offset
    ctx.drawImage(images.tonearmImg, -imgPivotX, -imgPivotY, armW, armH);
    ctx.restore();
  }

  // ── Extended overlays (config.extend = True) ────────────────────────────

  if (config.configExtend && trackInfo) {
    // Album art (static — skip if rotation is handled in turntable layer)
    if (albumArt && config.albumArt?.pos && config.albumArt?.dimension && !config.albumArt?.rotation) {
      const ax = config.albumArt.pos.x * scaleX;
      const ay = config.albumArt.pos.y * scaleY;
      const aw = config.albumArt.dimension.w * scaleX;
      const ah = config.albumArt.dimension.h * scaleY;
      if (config.albumArt.border) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = config.albumArt.border * scaleX;
        ctx.strokeRect(ax, ay, aw, ah);
      }
      ctx.drawImage(albumArt, ax, ay, aw, ah);
    }

    // Helper: draw text with position, color, maxWidth, font size
    // When align='center', text is centered within [pos.x, pos.x + maxWidth]
    const drawText = (text, posConfig, fontSize, color, maxWidth, align = 'left', fontFamily = 'sans-serif') => {
      if (!text || !posConfig) return;
      let x = posConfig.x * scaleX;
      const y = posConfig.y * scaleY;
      const weight = posConfig.fontWeight === 'bold' ? 'bold' : posConfig.fontWeight === 'light' ? '300' : 'normal';
      const size = fontSize * scaleY;
      ctx.font = `${weight} ${size}px ${fontFamily}`;
      ctx.fillStyle = color || config.font?.color || 'rgb(201,201,201)';
      ctx.textBaseline = 'top';
      if (align === 'center' && maxWidth) {
        // Center within [pos.x, pos.x + maxWidth] bounding box
        x += (maxWidth * scaleX) / 2;
        ctx.textAlign = 'center';
      } else {
        ctx.textAlign = align;
      }
      const mw = maxWidth ? maxWidth * scaleX : undefined;
      ctx.fillText(text, x, y, mw);
    };

    const fc = config.font?.color || 'rgb(201,201,201)';
    const center = config.playInfo?.center;
    const digiFontFallback = '"DS Digital", "Courier New", monospace';

    // Helper: resolve font size from a pos.fontWeight style
    const sizeForStyle = (style) => {
      if (style === 'bold') return config.font?.sizeBold || 37;
      if (style === 'light') return config.font?.sizeLight || 16;
      return config.font?.sizeRegular || 23;
    };

    // Play info text
    if (config.playInfo) {
      const pi = config.playInfo;
      const align = center ? 'center' : 'left';
      drawText(trackInfo.title, pi.title?.pos, sizeForStyle(pi.title?.pos?.fontWeight || 'bold'), pi.title?.color || fc, pi.title?.maxWidth, align);
      drawText(trackInfo.artist, pi.artist?.pos, sizeForStyle(pi.artist?.pos?.fontWeight || 'regular'), pi.artist?.color || fc, pi.artist?.maxWidth, align);
      drawText(trackInfo.album, pi.album?.pos, sizeForStyle(pi.album?.pos?.fontWeight || 'regular'), pi.album?.color || fc, pi.album?.maxWidth, align);
      // File type / service logo — draw icon if available, else text fallback
      if (pi.type?.pos) {
        const tc = pi.type.color || fc;
        const dim = pi.type.dimension;
        if (formatIcon && dim) {
          // Draw icon proportionally within dimension box, centered
          const bx = pi.type.pos.x * scaleX;
          const by = pi.type.pos.y * scaleY;
          const fullW = dim.w * scaleX;
          const fullH = dim.h * scaleY;
          const natW = formatIcon.naturalWidth || formatIcon.width;
          const natH = formatIcon.naturalHeight || formatIcon.height;
          const ratio = Math.min(fullW / natW, fullH / natH) * 0.85;
          const dw = natW * ratio;
          const dh = natH * ratio;
          ctx.drawImage(formatIcon, bx + (fullW - dw) / 2, by + (fullH - dh) / 2, dw, dh);
        } else if (trackInfo.trackType || trackInfo.service) {
          // Text fallback — size to fit within the dimension box
          const label = (trackInfo.trackType || trackInfo.service || '').toUpperCase();
          const fs = dim ? Math.min(dim.w * 0.4, dim.h * 0.8) : (config.font?.sizeRegular || 23);
          drawText(label, pi.type.pos, fs, tc, dim?.w || 0, 'left');
        }
      }
      // Samplerate / bitrate — digital font at style size, uses type_color
      if (pi.samplerate?.pos) {
        const srText = trackInfo.samplerate || trackInfo.bitrate || '';
        if (srText) {
          const tc = pi.type?.color || fc;
          const fs = sizeForStyle(pi.samplerate.pos?.fontWeight || 'light');
          const sAlign = center ? 'center' : 'left';
          drawText(srText, pi.samplerate.pos, fs, tc, pi.samplerate.maxWidth, sAlign, digiFontFallback);
        }
      }
    }

    // Time displays — digital font at sizeDigi * 1.8 (DS Digital renders smaller than DSEG7Classic), adjusted position
    if (config.time) {
      const DIGI_SCALE = 1.8;
      const Y_OFFSET = -0.25; // shift up by 25% of font size
      const X_OFFSET = 0.15;  // shift right by 15% of font size
      if (trackInfo.remaining && config.time.remaining?.pos) {
        const tc = config.time.remaining.color || fc;
        const fs = (config.time.remaining.fontSize || config.font?.sizeDigi || 30) * DIGI_SCALE;
        const ff = (config.time.remaining.font && images.fonts?.[config.time.remaining.font]) || digiFontFallback;
        const offsetPos = { ...config.time.remaining.pos, x: config.time.remaining.pos.x + fs * X_OFFSET, y: config.time.remaining.pos.y + fs * Y_OFFSET };
        drawText(trackInfo.remaining, offsetPos, fs, tc, 0, 'left', ff);
      }
      if (trackInfo.elapsed && config.time.elapsed?.pos) {
        const tc = config.time.elapsed.color || fc;
        const fs = (config.time.elapsed.fontSize || config.font?.sizeDigi || 30) * DIGI_SCALE;
        const ff = (config.time.elapsed.font && images.fonts?.[config.time.elapsed.font]) || digiFontFallback;
        const offsetPos = { ...config.time.elapsed.pos, x: config.time.elapsed.pos.x + fs * X_OFFSET, y: config.time.elapsed.pos.y + fs * Y_OFFSET };
        drawText(trackInfo.elapsed, offsetPos, fs, tc, 0, 'left', ff);
      }
      if (trackInfo.total && config.time.total?.pos) {
        const tc = config.time.total.color || fc;
        const fs = (config.time.total.fontSize || config.font?.sizeDigi || 30) * DIGI_SCALE;
        const ff = (config.time.total.font && images.fonts?.[config.time.total.font]) || digiFontFallback;
        const offsetPos = { ...config.time.total.pos, x: config.time.total.pos.x + fs * X_OFFSET, y: config.time.total.pos.y + fs * Y_OFFSET };
        drawText(trackInfo.total, offsetPos, fs, tc, 0, 'left', ff);
      }
    }

    // Progress bar
    if (config.progress?.pos && config.progress?.dim && trackInfo.progress > 0) {
      const px = config.progress.pos.x * scaleX;
      const py = config.progress.pos.y * scaleY;
      const pw = config.progress.dim.w * scaleX;
      const ph = config.progress.dim.h * scaleY;
      const isVertical = config.progress.sliderOrientation === 'vertical';

      if (config.progress.style === 'arc') {
        // Arc-style progress
        const radius = Math.min(pw, ph) / 2;
        const cx = px + pw / 2;
        const cy = py + ph / 2;
        const startRad = (config.progress.arcAngleStart * Math.PI) / 180;
        const endRad = (config.progress.arcAngleEnd * Math.PI) / 180;
        const progressRad = startRad + trackInfo.progress * (endRad - startRad);
        // Background arc
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startRad, endRad, endRad < startRad);
        ctx.strokeStyle = config.progress.bgColor || 'rgb(50,50,50)';
        ctx.lineWidth = (config.progress.arcWidth || 6) * scaleX;
        ctx.stroke();
        // Progress arc
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startRad, progressRad, endRad < startRad);
        ctx.strokeStyle = config.progress.color || 'rgb(0,255,100)';
        ctx.stroke();
      } else {
        // Bar-style progress
        if (config.progress.bgColor) {
          ctx.fillStyle = config.progress.bgColor;
          ctx.fillRect(px, py, pw, ph);
        }
        ctx.fillStyle = config.progress.color || 'rgb(20,143,230)';
        if (isVertical) {
          const fillH = trackInfo.progress * ph;
          ctx.fillRect(px, py + ph - fillH, pw, fillH);
        } else {
          ctx.fillRect(px, py, trackInfo.progress * pw, ph);
        }
        if (config.progress.border) {
          ctx.strokeStyle = config.progress.borderColor || 'rgb(80,80,80)';
          ctx.lineWidth = config.progress.border * scaleX;
          ctx.strokeRect(px, py, pw, ph);
        }
        // Progress head (slider knob image)
        if (images.progressHead) {
          const headW = images.progressHead.width * scaleX;
          const headH = images.progressHead.height * scaleY;
          const ho = config.progress.headOffset || { x: 0, y: 0 };
          if (isVertical) {
            const fillH = trackInfo.progress * ph;
            const hx = px + pw / 2 - headW / 2 + ho.x * scaleX;
            const hy = py + ph - fillH - headH / 2 + ho.y * scaleY;
            ctx.drawImage(images.progressHead, hx, hy, headW, headH);
          } else {
            const fillW = trackInfo.progress * pw;
            const hx = px + fillW - headW / 2 + ho.x * scaleX;
            const hy = py + ph / 2 - headH / 2 + ho.y * scaleY;
            ctx.drawImage(images.progressHead, hx, hy, headW, headH);
          }
        }
      }
    }

    // Volume indicator
    if (config.volume?.pos && config.volume?.dim) {
      const vx = config.volume.pos.x * scaleX;
      const vy = config.volume.pos.y * scaleY;
      const vw = config.volume.dim.w * scaleX;
      const vh = config.volume.dim.h * scaleY;
      const vol = (trackInfo.volume || 0) / 100;
      const isVertical = config.volume.sliderOrientation === 'vertical';

      if (config.volume.bgColor) {
        ctx.fillStyle = config.volume.bgColor;
        ctx.fillRect(vx, vy, vw, vh);
      }
      if (config.volume.color) {
        ctx.fillStyle = config.volume.color;
        if (isVertical) {
          const fillH = vol * vh;
          ctx.fillRect(vx, vy + vh - fillH, vw, fillH);
        } else {
          ctx.fillRect(vx, vy, vol * vw, vh);
        }
      }
      // Volume slider tip image
      if (images.volumeSliderTip) {
        const tipW = images.volumeSliderTip.width * scaleX;
        const tipH = images.volumeSliderTip.height * scaleY;
        const travel = config.volume.sliderTravel ? config.volume.sliderTravel.split(',').map(Number) : [0, 0];
        const tipOffset = config.volume.sliderTipOffset ? config.volume.sliderTipOffset.split(',').map(Number) : [0, 0];
        if (isVertical) {
          const travelDist = (travel[1] || vh / scaleY) * scaleY;
          const tipX = vx + tipOffset[0] * scaleX;
          const tipY = vy + travelDist - vol * travelDist + tipOffset[1] * scaleY;
          ctx.drawImage(images.volumeSliderTip, tipX, tipY, tipW, tipH);
        } else {
          const travelDist = (travel[1] || vw / scaleX) * scaleX;
          const tipX = vx + vol * travelDist + tipOffset[0] * scaleX;
          const tipY = vy + tipOffset[1] * scaleY;
          ctx.drawImage(images.volumeSliderTip, tipX, tipY, tipW, tipH);
        }
      }
    }

    // Playstate icon (stop=0, pause=1, play=2)
    if (images.playstateIcons && config.playstate?.pos) {
      const idx = trackInfo.isPlaying ? 2 : 1; // play or pause
      const icon = images.playstateIcons[idx];
      if (icon) {
        ctx.drawImage(icon, config.playstate.pos.x * scaleX, config.playstate.pos.y * scaleY, icon.width * scaleX, icon.height * scaleY);
      }
    }

    // Mute icon (muted=0, unmuted=1)
    if (images.muteIcons && config.mute?.pos) {
      const idx = trackInfo.mute ? 0 : 1;
      const icon = images.muteIcons[idx];
      if (icon) {
        ctx.drawImage(icon, config.mute.pos.x * scaleX, config.mute.pos.y * scaleY, icon.width * scaleX, icon.height * scaleY);
      }
    }

    // Repeat icon (off=0, all=1, single=2)
    if (images.repeatIcons && config.repeat?.pos) {
      const idx = trackInfo.repeat === true ? 1 : trackInfo.repeat === 'single' ? 2 : 0;
      const icon = images.repeatIcons[idx];
      if (icon) {
        ctx.drawImage(icon, config.repeat.pos.x * scaleX, config.repeat.pos.y * scaleY, icon.width * scaleX, icon.height * scaleY);
      }
    }

    // Shuffle icon (off=0, on=1, infinity=2)
    if (images.shuffleIcons && config.shuffle?.pos) {
      const idx = trackInfo.random === true ? 1 : trackInfo.random === 'infinity' ? 2 : 0;
      const icon = images.shuffleIcons[idx];
      if (icon) {
        ctx.drawImage(icon, config.shuffle.pos.x * scaleX, config.shuffle.pos.y * scaleY, icon.width * scaleX, icon.height * scaleY);
      }
    }
  }

  // Fanart overlay layer (if configured)
  drawFanartLayer('overlay');
}
