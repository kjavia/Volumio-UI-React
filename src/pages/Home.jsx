import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FlipClock from '@/components/clocks/flip-clock';
import DigitalClock from '@/components/clocks/digital-clock';
import AnalogClock from '@/components/clocks/analog-clock';
import Weather from '@/components/Weather';
import Wallpaper from '@/components/Wallpaper';
import Player from './Player';
import useIdleScreen from '@/hooks/useIdleScreen';
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

const ContextMenu = ({ vizStopped, onStopViz, onBackToPlayer }) => {
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
            {onBackToPlayer && (
              <>
                <button className="context-menu-item" onClick={close(onBackToPlayer)}>
                  <span className="material-icons">queue_music</span>
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
            <button className="context-menu-item danger" onClick={close(() => { window.location.href = VOLUMIO_BASE_URL; })}>
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
  const [vizStopped, setVizStopped] = useState(false);
  const [forcePlayer, setForcePlayer] = useState(false);
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
  } = useIdleScreen();

  // When the hook naturally clears idle (e.g. playback resumed), reset forcePlayer too
  useEffect(() => {
    if (!idle) setForcePlayer(false);
  }, [idle]);

  const showPlayer = !idle || forcePlayer;

  let content;

  if (showPlayer) {
    content = <Player vizStopped={vizStopped} onVizResumed={() => setVizStopped(false)} />;
  } else if (idleScreen === 'wallpaper') {
    content = (
      <Wallpaper
        url={wallpaperUrl}
        showTime={wallpaperShowTime}
        showSeconds={wallpaperShowSeconds}
        showWeather={wallpaperShowWeather}
        slideshowInterval={slideshowInterval}
      />
    );
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
        />
      );
    } else {
      const ClockComponent = CLOCK_SCREENS[idleScreen] || AnalogClock;
      content =
        idleScreen === 'analogClock' ? (
          <ClockComponent
            showWeather={showWeatherInClock}
            showSeconds
            showDate={analogClockShowDate}
          />
        ) : (
          <ClockComponent showWeather={showWeatherInClock} showSeconds />
        );
    }
  }

  return (
    <div className="position-relative h-100">
      <ContextMenu
        vizStopped={vizStopped}
        onStopViz={() => setVizStopped(true)}
        onBackToPlayer={idle && !forcePlayer ? () => setForcePlayer(true) : undefined}
      />
      {content}
    </div>
  );
};

export default Home;
