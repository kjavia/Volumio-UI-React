import { useState, useEffect } from 'react';
import FlipClock from '@/components/clocks/flip-clock';
import DigitalClock from '@/components/clocks/digital-clock';
import AnalogClock from '@/components/clocks/analog-clock';
import Weather from '@/components/Weather';
import Wallpaper from '@/components/Wallpaper';
import Player from './Player';
import useIdleScreen from '@/hooks/useIdleScreen';

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

const ContextMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        className="context-menu-toggle"
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
          </div>
        </>
      )}
    </div>
  );
};

const Home = () => {
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

  let content;

  if (!idle) {
    content = <Player />;
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
      <ContextMenu />
      {content}
    </div>
  );
};

export default Home;
