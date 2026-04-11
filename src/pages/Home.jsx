import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import FlipClock from '@/components/clocks/flip-clock';
import DigitalClock from '@/components/clocks/digital-clock';
import AnalogClock from '@/components/clocks/analog-clock';
import IframeScreen from '@/components/IframeScreen';
import Weather from '@/components/Weather';
import Wallpaper from '@/components/Wallpaper';
import Player from './Player';
import LargeScreenPlayer from './LargeScreenPlayer';
import useIdleScreen from '@/hooks/useIdleScreen';
import useMediaQuery from '@/hooks/useMediaQuery';
import usePluginConfig from '@/hooks/usePluginConfig';
import { VOLUMIO_BASE_URL } from '@/config';

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

const ContextMenu = ({ vizStopped, onStopViz, onBackToPlayer, onFullscreenViz, isVizFullscreen }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const close = (fn) => () => { setIsOpen(false); fn?.(); };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.body.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
    setIsOpen(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Listen for fullscreen changes (e.g., user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="context-menu-container">
      <button
        className="context-menu-toggle context-menu-toggle--no-shadow"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Menu"
      >
        <span className="material-icons">more_vert</span>
      </button>

      {isOpen && (
        <>
          <div className="context-menu-backdrop" onClick={() => setIsOpen(false)} />
          <div className="context-menu open">
            <button className="context-menu-item" onClick={close(() => navigate('/playlist-manager'))}>
              <span className="material-icons">queue_music</span>
              Playlist Manager
            </button>
            {onBackToPlayer && (
              <>
                <button className="context-menu-item" onClick={close(onBackToPlayer)}>
                  <span className="material-icons">arrow_back</span>
                  Back to Player
                </button>
                <div className="context-menu-separator" />
              </>
            )}
            <button className="context-menu-item" onClick={handleRefresh}>
              <span className="material-icons">refresh</span>
              Refresh
            </button>
            <button className="context-menu-item" onClick={toggleFullscreen}>
              <span className="material-icons">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
            {!vizStopped && onStopViz && (
              <>
                <div className="context-menu-separator" />
                <button className="context-menu-item" onClick={close(onFullscreenViz)}>
                  <span className="material-icons">
                    {isVizFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                  </span>
                  {isVizFullscreen ? 'Exit Visualization Fullscreen' : 'Visualization Fullscreen'}
                </button>
                <button className="context-menu-item" onClick={close(onStopViz)}>
                  <span className="material-icons">equalizer</span>
                  Stop Visualization
                </button>
              </>
            )}
            <div className="context-menu-separator" />
            <button className="context-menu-item" onClick={close(() => navigate(-1))}>
              <span className="material-icons">arrow_back</span>
              Back
            </button>
            <button className="context-menu-item danger" onClick={close(() => { window.location.assign(VOLUMIO_BASE_URL); })}>
              <span className="material-icons">power_settings_new</span>
              Exit
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const Home = () => {
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

  const handleFullscreenViz = async () => {
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
  };
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

  const showPlayer = !idle || forcePlayer;

  let content;

  if (showPlayer) {
    const contextMenuNode = (
      <ContextMenu
        vizStopped={vizStopped}
        onStopViz={isSpectrumViz ? () => setVizStopped(true) : undefined}
        onBackToPlayer={idle && !forcePlayer ? () => setForcePlayer(true) : undefined}
        onFullscreenViz={isSpectrumViz ? handleFullscreenViz : undefined}
        isVizFullscreen={isVizFullscreen}
      />
    );
    content = isLargeScreen
      ? <LargeScreenPlayer vizStopped={vizStopped} onVizResumed={() => setVizStopped(false)} menuSlot={contextMenuNode} />
      : <Player vizStopped={vizStopped} onVizResumed={() => setVizStopped(false)} vizContainerRef={vizContainerRef} />;
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

  // On the large-screen layout the menu is embedded in the bottom row, so we
  // normally skip the floating overlay. However when the idle screen is active
  // the player (and its embedded menu) is not mounted, so we still need the
  // floating overlay as the only way for the user to get back to the player.
  const floatingContextMenu = (!isLargeScreen || idle) && (
    <ContextMenu
      vizStopped={vizStopped}
      onStopViz={showPlayer && isSpectrumViz ? () => setVizStopped(true) : undefined}
      onBackToPlayer={idle && !forcePlayer ? () => setForcePlayer(true) : undefined}
      onFullscreenViz={showPlayer && isSpectrumViz ? handleFullscreenViz : undefined}
      isVizFullscreen={isVizFullscreen}
    />
  );

  return (
    <div className="position-relative h-100">
      {vizFullscreen && floatingContextMenu
        ? createPortal(floatingContextMenu, vizPortalTarget)
        : floatingContextMenu}
      {content}
    </div>
  );
};

export default Home;
