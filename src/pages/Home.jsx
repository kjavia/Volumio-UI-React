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
import CustomLayout from './CustomLayout';
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
  const [layoutIndex, setLayoutIndex] = useState(0);
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

  const useCustomLayout = pluginConfig?.useCustomLayout === true;
  const layoutDesigner = (() => {
    const raw = pluginConfig?.layoutDesigner;
    if (!raw) return { layouts: [] };
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return { layouts: [] }; }
    }
    return raw;
  })();
  // Matching layouts for current resolution — default sorted first so index 0 = preferred.
  const matchingLayouts = (() => {
    if (!useCustomLayout || !layoutDesigner?.layouts?.length) return [];
    const w = window.innerWidth;
    const h = window.innerHeight;
    const matches = layoutDesigner.layouts.filter((layout) =>
      (layout.width === w && layout.height === h) ||
      (layout.width === h && layout.height === w)
    );
    const def = matches.find((l) => l.isDefault);
    return def ? [def, ...matches.filter((l) => !l.isDefault)] : matches;
  })();

  // Reset to first layout whenever the set of matching layouts changes.
  const matchingLayoutIds = matchingLayouts.map((l) => l.id).join(',');
  useEffect(() => { setLayoutIndex(0); }, [matchingLayoutIds]);

  const currentCustomLayout = matchingLayouts.length
    ? matchingLayouts[layoutIndex % matchingLayouts.length]
    : null;

  // Swipe up from the bottom edge cycles through matching layouts.
  // Listeners use capture phase so child elements calling stopPropagation() can't block them.
  useEffect(() => {
    if (matchingLayouts.length < 2) return;
    const count = matchingLayouts.length;
    let startY = null;
    let fromEdge = false;

    const reset = () => { startY = null; fromEdge = false; };

    const onTouchStart = (e) => {
      const t = e.touches[0];
      startY = t.clientY;
      fromEdge = t.clientY > window.innerHeight - 80;
    };

    const onTouchEnd = (e) => {
      if (!fromEdge || startY === null) return;
      const deltaY = e.changedTouches[0].clientY - startY;
      if (deltaY < -50) {
        setLayoutIndex((prev) => (prev + 1) % count);
      }
      reset();
    };

    const opts = { passive: true, capture: true };
    document.addEventListener('touchstart', onTouchStart, opts);
    document.addEventListener('touchend', onTouchEnd, opts);
    document.addEventListener('touchcancel', reset, opts);
    return () => {
      document.removeEventListener('touchstart', onTouchStart, opts);
      document.removeEventListener('touchend', onTouchEnd, opts);
      document.removeEventListener('touchcancel', reset, opts);
    };
  }, [matchingLayouts.length]);

  // Apply user color overrides as CSS custom properties on :root
  useEffect(() => {
    const root = document.documentElement;
    const colorMap = {
      '--sp-track-color': { val: pluginConfig?.trackColor, cls: 'sp-has-track-color' },
      '--sp-artist-color': { val: pluginConfig?.artistColor, cls: 'sp-has-artist-color' },
      '--sp-album-color': { val: pluginConfig?.albumColor, cls: 'sp-has-album-color' },
      '--sp-stream-info-color': { val: pluginConfig?.streamInfoColor, cls: 'sp-has-stream-info-color' },
      '--sp-button-color': { val: pluginConfig?.buttonColor, cls: 'sp-has-button-color' },
      '--sp-btn-bg-color': { val: pluginConfig?.buttonBgColor, cls: 'sp-has-btn-bg-color' },
      '--sp-bar-track-color': { val: pluginConfig?.barTrackColor, cls: 'sp-has-bar-track-color' },
      '--sp-bar-text-color': { val: pluginConfig?.barTextColor, cls: 'sp-has-bar-text-color' },
      '--sp-icon-btn-color': { val: pluginConfig?.iconBtnColor, cls: 'sp-has-icon-btn-color' },
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
      '--sp-player-btn-size': { val: pluginConfig?.playerButtonSize, cls: 'sp-has-player-btn-size' },
      '--sp-icon-font-size': { val: pluginConfig?.secondaryRowFontSize, cls: 'sp-has-icon-font-size' },
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
    pluginConfig?.buttonColor,
    pluginConfig?.buttonBgColor,
    pluginConfig?.barTrackColor,
    pluginConfig?.barTextColor,
    pluginConfig?.iconBtnColor,
    pluginConfig?.titleFontSize,
    pluginConfig?.albumFontSize,
    pluginConfig?.artistFontSize,
    pluginConfig?.bitrateFontSize,
    pluginConfig?.progressFontSize,
    pluginConfig?.volumeFontSize,
    pluginConfig?.playerButtonSize,
    pluginConfig?.secondaryRowFontSize,
  ]);

  // Load Google Fonts and apply font-family CSS custom properties
  useEffect(() => {
    const root = document.documentElement;

    const fontFamilyMap = {
      '--sp-title-font-family': { val: pluginConfig?.titleFontName, cls: 'sp-has-title-font-family' },
      '--sp-album-font-family': { val: pluginConfig?.albumFontName, cls: 'sp-has-album-font-family' },
      '--sp-artist-font-family': { val: pluginConfig?.artistFontName, cls: 'sp-has-artist-font-family' },
      '--sp-bitrate-font-family': { val: pluginConfig?.bitrateFontName, cls: 'sp-has-bitrate-font-family' },
      '--sp-progress-font-family': { val: pluginConfig?.progressFontName, cls: 'sp-has-progress-font-family' },
      '--sp-volume-font-family': { val: pluginConfig?.volumeFontName, cls: 'sp-has-volume-font-family' },
    };

    // Collect unique non-empty font names that are likely Google Fonts
    // (not generic families like serif, sans-serif, monospace, cursive, fantasy, system-ui)
    const genericFamilies = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded']);
    const toLoad = new Set();
    Object.values(fontFamilyMap).forEach(({ val }) => {
      if (val && String(val).trim()) {
        const name = String(val).trim().replace(/^["']|["']$/g, '');
        if (!genericFamilies.has(name.toLowerCase())) toLoad.add(name);
      }
    });

    // Load each unique font from Google Fonts (idempotent — skip if already loaded)
    toLoad.forEach((name) => {
      const linkId = `gfont-${name.replace(/\s+/g, '-').toLowerCase()}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;700&display=swap`;
        document.head.appendChild(link);
      }
    });

    // Apply / remove CSS vars and classes
    Object.entries(fontFamilyMap).forEach(([prop, { val, cls }]) => {
      const name = val ? String(val).trim() : '';
      if (name) {
        // Quote the font name for CSS if it contains spaces
        const cssValue = /\s/.test(name) ? `"${name}"` : name;
        root.style.setProperty(prop, cssValue);
        root.classList.add(cls);
      } else {
        root.style.removeProperty(prop);
        root.classList.remove(cls);
      }
    });
  }, [
    pluginConfig?.titleFontName,
    pluginConfig?.albumFontName,
    pluginConfig?.artistFontName,
    pluginConfig?.bitrateFontName,
    pluginConfig?.progressFontName,
    pluginConfig?.volumeFontName,
  ]);

  const showPlayer = !idle || forcePlayer;

  let content;

  if (showPlayer) {
    if (currentCustomLayout) {
      content = <CustomLayout layout={currentCustomLayout} vizStopped={vizStopped} onVizResumed={() => setVizStopped(false)} vizContainerRef={vizContainerRef} />;
    } else {
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
    }
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

  // Press 'v' while on the player to toggle viz fullscreen
  useEffect(() => {
    if (!showPlayer || !hasViz) return;
    const handler = (e) => {
      if (e.key !== 'v' && e.key !== 'V') return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      handleFullscreenViz();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showPlayer, hasViz, handleFullscreenViz]);

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
