import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import useWeather from '@/hooks/useWeather';
import useWallpaperImages from '@/hooks/useWallpaperImages';
import './Wallpaper.scss';

const ICON_COLORS = {
  wb_sunny: '#FFB300',
  cloud: '#90A4AE',
  foggy: '#B0BEC5',
  grain: '#64B5F6',
  water_drop: '#42A5F5',
  ac_unit: '#81D4FA',
  thunderstorm: '#AB47BC',
  help_outline: '#BDBDBD',
};

const Wallpaper = ({
  url,
  showTime = true,
  showSeconds = false,
  showWeather = true,
  slideshowInterval = 30,
}) => {
  const { data: images = [] } = useWallpaperImages(url);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [time, setTime] = useState(() => new Date());
  const { data: weather } = useWeather();

  // Reset index when images change
  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  // Slideshow cycling
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, slideshowInterval * 1000);
    return () => clearInterval(interval);
  }, [images.length, slideshowInterval]);

  // Clock tick
  useEffect(() => {
    if (!showTime) return;
    let intervalId;
    const tick = () => setTime(new Date());
    const msToNextSecond = 1000 - new Date().getMilliseconds();
    const syncTimeout = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, 1000);
    }, msToNextSecond);
    return () => {
      clearTimeout(syncTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [showTime]);

  const formatTime = useCallback(() => {
    const h = time.getHours() % 12 || 12;
    const m = String(time.getMinutes()).padStart(2, '0');
    const s = String(time.getSeconds()).padStart(2, '0');
    const ampm = time.getHours() >= 12 ? 'PM' : 'AM';
    return showSeconds ? `${h}:${m}:${s} ${ampm}` : `${h}:${m} ${ampm}`;
  }, [time, showSeconds]);

  const currentImage = images[currentIndex];

  return (
    <div className="wallpaper">
      {/* Background images with crossfade */}
      {images.map((img, i) => (
        <div
          key={img}
          className={`wallpaper-bg ${i === currentIndex ? 'wallpaper-bg--active' : ''}`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}

      {/* Fallback when no image */}
      {!currentImage && <div className="wallpaper-bg wallpaper-bg--active wallpaper-bg--empty" />}

      {/* Overlay */}
      {(showTime || showWeather) && (
        <div className="wallpaper-overlay">
          {showTime && <span className="wallpaper-time">{formatTime()}</span>}
          {showWeather && weather?.current && (
            <div className="wallpaper-weather">
              <span
                className="material-icons wallpaper-weather-icon"
                style={{ color: ICON_COLORS[weather.current.icon] || ICON_COLORS.help_outline }}
              >
                {weather.current.icon}
              </span>
              <span className="wallpaper-weather-temp">
                {Math.round(weather.current.temperature)}
                {weather.units.tempUnit}
              </span>
              <span className="wallpaper-weather-desc">{weather.current.description}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

Wallpaper.propTypes = {
  url: PropTypes.string,
  showTime: PropTypes.bool,
  showSeconds: PropTypes.bool,
  showWeather: PropTypes.bool,
  slideshowInterval: PropTypes.number,
};

export default Wallpaper;
