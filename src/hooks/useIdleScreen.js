import { useState, useEffect, useRef } from 'react';
import useVolumioStatus from './useVolumioStatus';
import usePluginConfig from './usePluginConfig';

/**
 * Returns { idle, idleScreen } based on Volumio playback status and plugin config.
 *
 * When status !== 'play' for longer than idleTimeout minutes, idle becomes true.
 * When status === 'play', idle immediately becomes false.
 * idleTimeout of 0 disables the idle screen (idle stays false).
 */
const useIdleScreen = () => {
  const { status } = useVolumioStatus();
  const { data: config } = usePluginConfig();
  const idleTimeout = config?.idleTimeout ?? 5; // minutes
  const idleScreen = config?.idleScreen ?? 'analogClock';
  const showWeatherInClock = config?.showWeatherInClock ?? true;
  const wallpaperUrl = config?.wallpaperUrl ?? '';
  const wallpaperShowTime = config?.wallpaperShowTime ?? true;
  const wallpaperShowSeconds = config?.wallpaperShowSeconds ?? false;
  const wallpaperShowWeather = config?.wallpaperShowWeather ?? true;
  const slideshowInterval = config?.slideshowInterval ?? 30;
  const analogClockShowDate = config?.analogClockShowDate ?? true;

  const [idle, setIdle] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (status === 'play') {
      // Playing — cancel idle immediately
      setIdle(false);
      return;
    }

    // Not playing — start idle countdown (if enabled)
    if (idleTimeout <= 0) {
      // Disabled
      setIdle(false);
      return;
    }

    timerRef.current = setTimeout(
      () => {
        setIdle(true);
      },
      idleTimeout * 60 * 1000
    );

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, idleTimeout]);

  return {
    idle,
    idleScreen,
    showWeatherInClock,
    wallpaperUrl,
    wallpaperShowTime,
    wallpaperShowSeconds,
    wallpaperShowWeather,
    slideshowInterval,
    analogClockShowDate,
  };
};

export default useIdleScreen;
