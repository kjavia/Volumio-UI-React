import PropTypes from 'prop-types';
import useWeather from '@/hooks/useWeather';
import './Weather.scss';

/* ── Helpers ──────────────────────────────────────────────────────────── */

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const formatHour = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric' });
};

const formatDay = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short' });
};

const formatDate = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const round = (n) => Math.round(n);

/* ── Sub-components ───────────────────────────────────────────────────── */

const WeatherIcon = ({ name, className = '' }) => (
  <span className={`material-icons weather-icon ${className}`}>{name}</span>
);
WeatherIcon.propTypes = { name: PropTypes.string.isRequired, className: PropTypes.string };

const DetailRow = ({ icon, label, value }) => (
  <div className="weather-detail">
    <WeatherIcon name={icon} className="weather-detail-icon" />
    <span className="weather-detail-label">{label}</span>
    <span className="weather-detail-value">{value}</span>
  </div>
);
DetailRow.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

/* ── Current Weather ──────────────────────────────────────────────────── */

const CurrentWeather = ({
  current,
  units,
  showWind,
  showHumidity,
  showFeelsLike,
  showSunrise,
  showSunset,
  todaySunrise,
  todaySunset,
}) => (
  <div className="weather-current">
    <div className="weather-current-main">
      <WeatherIcon name={current.icon} className="weather-current-icon" />
      <span className="weather-current-temp">
        {round(current.temperature)}
        <span className="weather-current-unit">{units.tempUnit}</span>
      </span>
    </div>
    <span className="weather-current-desc">{current.description}</span>
    <div className="weather-details">
      {showFeelsLike && (
        <DetailRow
          icon="thermostat"
          label="Feels like"
          value={`${round(current.apparentTemperature)}${units.tempUnit}`}
        />
      )}
      {showWind && (
        <DetailRow
          icon="air"
          label="Wind"
          value={`${round(current.windSpeed)} ${units.windUnit}`}
        />
      )}
      {showHumidity && (
        <DetailRow icon="water_drop" label="Humidity" value={`${current.humidity}%`} />
      )}
      {showSunrise && todaySunrise && (
        <DetailRow icon="wb_twilight" label="Sunrise" value={formatTime(todaySunrise)} />
      )}
      {showSunset && todaySunset && (
        <DetailRow icon="nights_stay" label="Sunset" value={formatTime(todaySunset)} />
      )}
    </div>
  </div>
);
CurrentWeather.propTypes = {
  current: PropTypes.object.isRequired,
  units: PropTypes.object.isRequired,
  showWind: PropTypes.bool,
  showHumidity: PropTypes.bool,
  showFeelsLike: PropTypes.bool,
  showSunrise: PropTypes.bool,
  showSunset: PropTypes.bool,
  todaySunrise: PropTypes.string,
  todaySunset: PropTypes.string,
};

/* ── Hourly Forecast ──────────────────────────────────────────────────── */

const HourlyForecast = ({ hourly, units, showWind }) => (
  <div className="weather-hourly">
    <div className="weather-hourly-scroll">
      {hourly.map((h) => (
        <div key={h.time} className="weather-hourly-item">
          <span className="weather-hourly-time">{formatHour(h.time)}</span>
          <WeatherIcon name={h.icon} className="weather-hourly-icon" />
          <span className="weather-hourly-temp">
            {round(h.temperature)}
            {units.tempUnit}
          </span>
          {showWind && <span className="weather-hourly-wind">{round(h.windSpeed)}</span>}
        </div>
      ))}
    </div>
  </div>
);
HourlyForecast.propTypes = {
  hourly: PropTypes.array.isRequired,
  units: PropTypes.object.isRequired,
  showWind: PropTypes.bool,
};

/* ── Daily Forecast Card ──────────────────────────────────────────────── */

const DailyCard = ({ day, units, showWind, showSunrise, showSunset, showPrecip, isToday }) => (
  <div className={`weather-daily-card ${isToday ? 'weather-daily-card--today' : ''}`}>
    <span className="weather-daily-day">{isToday ? 'Today' : formatDay(day.date)}</span>
    <span className="weather-daily-date">{formatDate(day.date)}</span>
    <WeatherIcon name={day.icon} className="weather-daily-icon" />
    <span className="weather-daily-desc">{day.description}</span>
    <div className="weather-daily-temps">
      <span className="weather-daily-hi">{round(day.tempMax)}°</span>
      <span className="weather-daily-lo">{round(day.tempMin)}°</span>
    </div>
    {showWind && (
      <div className="weather-daily-meta">
        <WeatherIcon name="air" className="weather-daily-meta-icon" />
        <span>
          {round(day.windSpeedMax)} {units.windUnit}
        </span>
      </div>
    )}
    {showPrecip && day.precipitation > 0 && (
      <div className="weather-daily-meta">
        <WeatherIcon name="water_drop" className="weather-daily-meta-icon" />
        <span>
          {day.precipitation} {units.precipUnit}
        </span>
      </div>
    )}
    {(showSunrise || showSunset) && (
      <div className="weather-daily-sun">
        {showSunrise && (
          <span className="weather-daily-sun-item">
            <WeatherIcon name="wb_twilight" className="weather-daily-meta-icon" />
            {formatTime(day.sunrise)}
          </span>
        )}
        {showSunset && (
          <span className="weather-daily-sun-item">
            <WeatherIcon name="nights_stay" className="weather-daily-meta-icon" />
            {formatTime(day.sunset)}
          </span>
        )}
      </div>
    )}
  </div>
);
DailyCard.propTypes = {
  day: PropTypes.object.isRequired,
  units: PropTypes.object.isRequired,
  showWind: PropTypes.bool,
  showSunrise: PropTypes.bool,
  showSunset: PropTypes.bool,
  showPrecip: PropTypes.bool,
  isToday: PropTypes.bool,
};

/* ── Main Weather Component ───────────────────────────────────────────── */

const Weather = ({
  mode = 'current',
  showWind = true,
  showHumidity = true,
  showFeelsLike = true,
  showSunrise = false,
  showSunset = false,
  showPrecip = true,
  days = 10,
  hours = 24,
}) => {
  const { data, isLoading, isError } = useWeather();

  if (isLoading) {
    return (
      <div className="weather-container weather-container--loading">
        <span className="material-icons weather-loading-icon">cloud_sync</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="weather-container weather-container--error">
        <span className="material-icons weather-error-icon">cloud_off</span>
        <span className="weather-error-text">Weather unavailable</span>
      </div>
    );
  }

  const { current, hourly, daily, units } = data;
  const today = daily[0];

  return (
    <div className="weather-container">
      {/* Current */}
      {(mode === 'current' || mode === 'full') && (
        <CurrentWeather
          current={current}
          units={units}
          showWind={showWind}
          showHumidity={showHumidity}
          showFeelsLike={showFeelsLike}
          showSunrise={showSunrise}
          showSunset={showSunset}
          todaySunrise={today?.sunrise}
          todaySunset={today?.sunset}
        />
      )}

      {/* Hourly */}
      {(mode === 'hourly' || mode === 'full') && (
        <HourlyForecast hourly={hourly.slice(0, hours)} units={units} showWind={showWind} />
      )}

      {/* Daily */}
      {(mode === 'daily' || mode === 'full') && (
        <div className="weather-daily">
          {daily.slice(0, days).map((d, i) => (
            <DailyCard
              key={d.date}
              day={d}
              units={units}
              showWind={showWind}
              showSunrise={showSunrise}
              showSunset={showSunset}
              showPrecip={showPrecip}
              isToday={i === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};

Weather.propTypes = {
  mode: PropTypes.oneOf(['current', 'hourly', 'daily', 'full']),
  showWind: PropTypes.bool,
  showHumidity: PropTypes.bool,
  showFeelsLike: PropTypes.bool,
  showSunrise: PropTypes.bool,
  showSunset: PropTypes.bool,
  showPrecip: PropTypes.bool,
  days: PropTypes.number,
  hours: PropTypes.number,
};

export default Weather;
