import FlipClock from '@/components/clocks/flip-clock';
import Player from './Player';
import DigitalClock from '@/components/clocks/digital-clock';
import AnalogClock from '@/components/clocks/analog-clock';
import Weather from '@/components/Weather';

const Home = () => {
  return <DigitalClock showWeather />;
};

export default Home;
