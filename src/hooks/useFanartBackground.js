import { useEffect, useMemo, useRef, useState } from 'react';
import useFanartTv from './useFanartTv';
import usePluginConfig from './usePluginConfig';

/**
 * Provides a rotating fanart.tv background URL for the currently playing
 * track, along with a ref callback that applies the background image with
 * `!important` inline styles so theme rules (e.g. OLED's forced black
 * background) cannot override it.
 *
 * Usage:
 *   const { fanartBackgroundUrl, fanartBgRef } = useFanartBackground({ artist, album });
 *   {fanartBackgroundUrl && (
 *     <div ref={fanartBgRef} className="position-absolute top-0 start-0 w-100 h-100" />
 *   )}
 *
 * The hook is a no-op (returns null URL, no ref effect) unless:
 *  - `displayFanartBackground` is true in plugin config, AND
 *  - `fanartTvApiKey` is configured, AND
 *  - fanart.tv returns at least one image for the artist / album.
 */
const useFanartBackground = ({ artist, album } = {}) => {
  const { data: pluginConfig } = usePluginConfig();
  const enabled = pluginConfig?.displayFanartBackground === true;
  const grayscale = pluginConfig?.fanartBackgroundGrayscale === true;
  const slideshowInterval = Math.max(5, Number(pluginConfig?.slideshowInterval) || 30);

  const { data: fanartData } = useFanartTv({
    artist: enabled ? artist : null,
    album: enabled ? album : null,
  });

  const images = useMemo(() => {
    if (!enabled) return [];
    const imgs = fanartData?.images || [];
    return Array.isArray(imgs) ? imgs : [];
  }, [enabled, fanartData]);

  const [frame, setFrame] = useState(0);
  useEffect(() => {
    setFrame(0);
    if (!enabled || images.length <= 1) return undefined;
    const timer = setInterval(() => {
      setFrame((n) => (n + 1) % images.length);
    }, slideshowInterval * 1000);
    return () => clearInterval(timer);
  }, [enabled, images, slideshowInterval]);

  const fanartBackgroundUrl = enabled && images.length
    ? images[frame % images.length]
    : null;

  // Apply the background image with !important via setProperty so theme
  // rules cannot override it (React's style prop cannot emit !important).
  const fanartBgRef = useRef(null);
  useEffect(() => {
    const el = fanartBgRef.current;
    if (!el || !fanartBackgroundUrl) return;
    el.style.setProperty('background-image', `url("${fanartBackgroundUrl}")`, 'important');
    el.style.setProperty('background-color', 'transparent', 'important');
    el.style.setProperty('background-size', 'cover', 'important');
    el.style.setProperty('background-position', 'center', 'important');
    el.style.setProperty('filter', grayscale ? 'grayscale(100%)' : 'none', 'important');
    el.style.setProperty('transform', 'none', 'important');
  }, [fanartBackgroundUrl, grayscale]);

  return { fanartBackgroundUrl, fanartBgRef, fanartActive: !!fanartBackgroundUrl };
};

export default useFanartBackground;
