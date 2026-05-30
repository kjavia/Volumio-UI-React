import { useState, useEffect, useRef, useCallback } from 'react';
import FlipClock from '@/components/clocks/flip-clock';
import DigitalClock from '@/components/clocks/digital-clock';
import AnalogClock from '@/components/clocks/analog-clock';
import IframeScreen from '@/components/IframeScreen';
import Weather from '@/components/Weather';
import Wallpaper from '@/components/Wallpaper';
import AppMenu from '@/components/AppMenu';
import TabletPlayer from './TabletPlayer';
import MobilePlayer from './MobilePlayer';
import LargeScreenPlayer from './LargeScreenPlayer';
import useIdleScreen from '@/hooks/useIdleScreen';
import useMediaQuery from '@/hooks/useMediaQuery';
import usePluginConfig from '@/hooks/usePluginConfig';

const CLOCK_SCREENS = {
  analogClock: AnalogClock,
  digitalClock: DigitalClock,
  flipClock: FlipClock,
};

const WEATHER_MODE_MAP = {
  weatherCurrent: 'current',
  weatherHourly: 'hourly',
  weatherDaily: 'daily',
  weatherFull: 'full',
};

const Home = () => {
  useEffect(() => { document.title = 'Volumio - Stylish Player | Now Playing'; }, []);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isLargeScreen = useMediaQuery('(min-width: 1920px)');
  const [vizStopped, setVizStopped] = useState(false);
  const [forcePlayer, setForcePlayer] = useState(false);
  const [isVizFullscreen, setIsVizFullscreen] = useState(false);
  const [vizPortalTarget, setVizPortalTarget] = useState(null);
  const vizContainerRef = useRef(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isViz =
        !!document.fullscreenElement &&
        document.fullscreenElement === vizContainerRef.current;
      setIsVizFullscreen(isViz);
      setVizPortalTarget(isViz ? document.fullscreenElement : null);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleFullscreenViz = useCallback(async () => {
    const el = vizContainerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Viz fullscreen failed:', err);
    }
  }, []);
  const {
    idle,
    idleScreen,
    showWeatherInClock,
    wallpaperUrl,
    wallpaperShowTime,
    wallpaperShowSeconds,
    wallpaperShowWeather,
    slideshowInterval,
    analogClockShowDate,
    externalUrl,
    use24Hour,
  } = useIdleScreen();

  // When idle clears naturally (e.g. playback resumed), reset forcePlayer.
  // Using the render-time previous-state pattern avoids calling setState inside
  // a useEffect body, which the React compiler flags as a cascading-render risk.
  const [prevIdle, setPrevIdle] = useState(idle);
  if (prevIdle !== idle) {
    setPrevIdle(idle);
    if (!idle) setForcePlayer(false);
  }

  const { data: pluginConfig } = usePluginConfig();
  const vizType = pluginConfig?.vizType || 'spectrum';
  const isSpectrumViz = vizType === 'spectrum';
  const hasViz = vizType !== 'none';

  // Apply user color overrides as CSS custom properties on :root
  useEffect(() => {
    const root = document.documentElement;
    const colorMap = {
      '--sp-track-color': { val: pluginConfig?.trackColor, cls: 'sp-has-track-color' },
      '--sp-artist-color': { val: pluginConfig?.artistColor, cls: 'sp-has-artist-color' },
      '--sp-album-color': { val: pluginConfig?.albumColor, cls: 'sp-has-album-color' },
      '--sp-stream-info-color': { val: pluginConfig?.streamInfoColor, cls: 'sp-has-stream-info-color' },
      '--sp-control-color': { val: pluginConfig?.controlColor, cls: 'sp-has-control-color' },
    };
    Object.entries(colorMap).forEach(([prop, { val, cls }]) => {
      if (val) {
        root.style.setProperty(prop, val);
        root.classList.add(cls);
      } else {
        root.style.removeProperty(prop);
        root.classList.remove(cls);
      }
    });
    // Apply user font-size overrides as CSS custom properties on :root
    const fontMap = {
      '--sp-title-font-size': { val: pluginConfig?.titleFontSize, cls: 'sp-has-title-font-size' },
      '--sp-album-font-size': { val: pluginConfig?.albumFontSize, cls: 'sp-has-album-font-size' },
      '--sp-artist-font-size': { val: pluginConfig?.artistFontSize, cls: 'sp-has-artist-font-size' },
      '--sp-bitrate-font-size': { val: pluginConfig?.bitrateFontSize, cls: 'sp-has-bitrate-font-size' },
      '--sp-progress-font-size': { val: pluginConfig?.progressFontSize, cls: 'sp-has-progress-font-size' },
      '--sp-volume-font-size': { val: pluginConfig?.volumeFontSize, cls: 'sp-has-volume-font-size' },
    };
    const normalizeFontSize = (v) => {
      if (v === null || v === undefined) return v;
      if (typeof v === 'number') return `${v}px`;
      const s = String(v).trim();
      // If the value is just a number, treat as pixels
      if (/^\d+(?:\.\d+)?$/.test(s)) return `${s}px`;
      return s;
    };

    Object.entries(fontMap).forEach(([prop, { val, cls }]) => {
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        root.style.setProperty(prop, normalizeFontSize(val));
        root.classList.add(cls);
      } else {
        root.style.removeProperty(prop);
        root.classList.remove(cls);
      }
    });
  }, [
    pluginConfig?.trackColor,
    pluginConfig?.artistColor,
    pluginConfig?.albumColor,
    pluginConfig?.streamInfoColor,
    pluginConfig?.controlColor,
    pluginConfig?.titleFontSize,
    pluginConfig?.albumFontSize,
    pluginConfig?.artistFontSize,
    pluginConfig?.bitrateFontSize,
    pluginConfig?.progressFontSize,
    pluginConfig?.volumeFontSize,
  ]);

  const showPlayer = !idle || forcePlayer;

  let content;

  if (showPlayer) {
    const contextMenuNode = (
      <AppMenu
        vizStopped={vizStopped}
        onStopViz={isSpectrumViz ? () => setVizStopped(true) : undefined}
        onBackToPlayer={idle && !forcePlayer ? () => setForcePlayer(true) : undefined}
        onFullscreenViz={hasViz ? handleFullscreenViz : undefined}
        isVizFullscreen={isVizFullscreen}
      />
    );
    content = isMobile
      ? <MobilePlayer
        vizStopped={vizStopped}
        onVizResumed={() => setVizStopped(false)}
      />
      : isLargeScreen
        ? <LargeScreenPlayer vizStopped={vizStopped} onVizResumed={() => setVizStopped(false)} menuSlot={contextMenuNode} vizContainerRef={vizContainerRef} />
        : <TabletPlayer vizStopped={vizStopped} onVizResumed={() => setVizStopped(false)} vizContainerRef={vizContainerRef} />;
  } else if (idleScreen === 'wallpaper') {
    content = (
      <Wallpaper
        url={wallpaperUrl}
        showTime={wallpaperShowTime}
        showSeconds={wallpaperShowSeconds}
        showWeather={wallpaperShowWeather}
        slideshowInterval={slideshowInterval}
        use24Hour={use24Hour}
      />
    );
  } else if (idleScreen === 'externalUrl') {
    content = <IframeScreen url={externalUrl} />;
  } else {
    const weatherMode = WEATHER_MODE_MAP[idleScreen];
    if (weatherMode) {
      content = (
        <Weather
          mode={weatherMode}
          showWind
          showHumidity
          showFeelsLike
          showSunrise
          showSunset
          showPrecip
          use24Hour={use24Hour}
        />
      );
    } else {
      const ClockComponent = CLOCK_SCREENS[idleScreen] || AnalogClock;
      content =
        idleScreen === 'analogClock' ? (
          <ClockComponent
            showWeather={showWeatherInClock}
            showSeconds={wallpaperShowSeconds}
            showDate={analogClockShowDate}
          />
        ) : (
          <ClockComponent showWeather={showWeatherInClock} showSeconds={wallpaperShowSeconds} use12Hour={!use24Hour} />
        );
    }
  }

  const vizFullscreen = isVizFullscreen && !!vizPortalTarget;

  // Double-click/tap on viz container toggles fullscreen
  useEffect(() => {
    const handler = (e) => {
      const el = vizContainerRef.current;
      if (!el || !el.contains(e.target)) return;
      e.preventDefault();
      handleFullscreenViz();
    };
    document.addEventListener('dblclick', handler);
    return () => document.removeEventListener('dblclick', handler);
  }, [handleFullscreenViz]);

  // On the large-screen layout the menu is embedded in the bottom row, so we
  // normally skip the floating overlay. However when the idle screen is active
  // the player (and its embedded menu) is not mounted, so we still need the
  // floating overlay as the only way for the user to get back to the player.
  const floatingContextMenu = !vizFullscreen && (!isLargeScreen || idle) && (
    <AppMenu
      vizStopped={vizStopped}
      onStopViz={showPlayer && isSpectrumViz ? () => setVizStopped(true) : undefined}
      onBackToPlayer={idle && !forcePlayer ? () => setForcePlayer(true) : undefined}
      onFullscreenViz={showPlayer && hasViz ? handleFullscreenViz : undefined}
      isVizFullscreen={isVizFullscreen}
    />
  );

  return (
    <div className="position-relative h-100">
      {floatingContextMenu}
      {content}
    </div>
  );
};

export default Home;
