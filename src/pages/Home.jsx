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
      {/* <RefreshButton /> */}
      {content}
    </div>
  );
};

export default Home;
