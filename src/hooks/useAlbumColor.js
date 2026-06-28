import { useState, useEffect } from 'react';

/**
 * WCAG relative luminance for an sRGB colour in the range [0, 255].
 * Returns a value in [0, 1] where 0 = black and 1 = white.
 */
const relativeLuminance = (r, g, b) =>
  [r, g, b].reduce((sum, c, i) => {
    const s = c / 255;
    const lin = s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    return sum + lin * [0.2126, 0.7152, 0.0722][i];
  }, 0);

/**
 * Returns '#fff' or '#000' – whichever has the higher WCAG contrast ratio
 * against the given sRGB colour.
 */
const contrastFor = (r, g, b) =>
  relativeLuminance(r, g, b) > 0.179 ? '#000' : '#fff';

/**
 * Finds the most dominant colour in an album-art image using a simple
 * colour histogram on a downscaled canvas, and computes a WCAG-compliant
 * foreground colour (#fff or #000) for text placed on top.
 *
 * @param {string} imageUrl - Full URL of the album art image.
 * @param {string} fallback - CSS colour used while loading or on error.
 * @returns {{ color: string, contrastColor: string }}
 */
const useAlbumColor = (imageUrl, fallback = '#4d7fb4') => {
  const [result, setResult] = useState({ color: fallback, contrastColor: '#fff' });

  useEffect(() => {
    if (!imageUrl) {
      setResult({ color: fallback, contrastColor: '#fff' });
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (cancelled) return;
      try {
        const SIZE = 64;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

        // Quantise each channel into 8 buckets (step = 32) and tally occurrences.
        const STEP = 32;
        const counts = {};
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue; // skip near-transparent pixels
          const r = Math.round(data[i]     / STEP) * STEP;
          const g = Math.round(data[i + 1] / STEP) * STEP;
          const b = Math.round(data[i + 2] / STEP) * STEP;
          const key = `${r},${g},${b}`;
          counts[key] = (counts[key] || 0) + 1;
        }

        // Pick the bucket with the highest pixel count.
        let maxCount = 0;
        let dominantKey = null;
        for (const [key, count] of Object.entries(counts)) {
          if (count > maxCount) { maxCount = count; dominantKey = key; }
        }

        if (!dominantKey) {
          setResult({ color: fallback, contrastColor: '#fff' });
          return;
        }

        const [r, g, b] = dominantKey.split(',').map(Number);
        setResult({
          color: `rgb(${r},${g},${b})`,
          contrastColor: contrastFor(r, g, b),
        });
      } catch {
        setResult({ color: fallback, contrastColor: '#fff' });
      }
    };

    img.onerror = () => {
      if (!cancelled) setResult({ color: fallback, contrastColor: '#fff' });
    };

    img.src = imageUrl;
    return () => { cancelled = true; };
  }, [imageUrl, fallback]);

  return result;
};

export default useAlbumColor;
