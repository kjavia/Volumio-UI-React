import { useEffect, useRef } from 'react';
import FlipClock from '@/components/clocks/flip-clock';
import DigitalClock from '@/components/clocks/digital-clock';
import AnalogClock from '@/components/clocks/analog-clock';
import Weather from '@/components/Weather';
import Wallpaper from '@/components/Wallpaper';
import Player from './Player';
import useIdleScreen from '@/hooks/useIdleScreen';
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

const RefreshButton = () => (
  <div className="position-absolute top-0 end-0 p-3" style={{ zIndex: 100 }}>
    <button
      className="btn btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center"
      onClick={() => window.location.reload()}
      title="Reload Page"
      style={{ width: 40, height: 40 }}
    >
      <span className="material-icons">refresh</span>
    </button>
  </div>
);

const Home = () => {
  const containerRef = useRef(null);
  const { data: pluginConfig } = usePluginConfig();
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

  // Handle auto-fullscreen on mount if enabled
  useEffect(() => {
    if (pluginConfig?.startInFullscreen && containerRef.current) {
      const enterFullscreen = async () => {
        try {
          if (!document.fullscreenElement) {
            await containerRef.current.requestFullscreen();
          }
        } catch (err) {
          console.warn('Auto-fullscreen failed:', err);
        }
      };

      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(enterFullscreen, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [pluginConfig?.startInFullscreen]);

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
    <div ref={containerRef} className="position-relative h-100">
      {/* <RefreshButton /> */}
      {content}
    </div>
  );
};

export default Home;
