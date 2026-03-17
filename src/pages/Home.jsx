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
  } = useIdleScreen();

  if (!idle) {
    return <Player />;
  }

  // Wallpaper screen
  if (idleScreen === 'wallpaper') {
    return (
      <Wallpaper
        url={wallpaperUrl}
        showTime={wallpaperShowTime}
        showSeconds={wallpaperShowSeconds}
        showWeather={wallpaperShowWeather}
        slideshowInterval={slideshowInterval}
      />
    );
  }

  // Weather screens
  const weatherMode = WEATHER_MODE_MAP[idleScreen];
  if (weatherMode) {
    return (
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
  }

  // Clock screens
  const ClockComponent = CLOCK_SCREENS[idleScreen] || AnalogClock;
  return <ClockComponent showWeather={showWeatherInClock} showSeconds />;
};

export default Home;
