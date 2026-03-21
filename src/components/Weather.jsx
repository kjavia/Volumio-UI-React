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

const ICON_COLORS = {
  wb_sunny: '#FFB300', // amber/gold for sun
  cloud: '#90A4AE', // blue-gray for clouds
  foggy: '#B0BEC5', // silver for fog
  grain: '#64B5F6', // light blue for drizzle
  water_drop: '#42A5F5', // blue for rain
  ac_unit: '#81D4FA', // ice blue for snow/freezing
  thunderstorm: '#AB47BC', // purple for storms
  wb_twilight: '#FF8F00', // amber for sunrise
  nights_stay: '#5C6BC0', // indigo for sunset
  air: '#78909C', // gray-blue for wind
  thermostat: '#EF5350', // red for temperature
  help_outline: '#BDBDBD', // gray fallback
};

const WeatherIcon = ({ name, className = '' }) => (
  <span
    className={`material-icons weather-icon ${className}`}
    style={{ color: ICON_COLORS[name] || ICON_COLORS.help_outline }}
  >
    {name}
  </span>
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
          {showWind && (
            <span className="weather-hourly-wind">
              <WeatherIcon name="air" className="weather-hourly-wind-icon" />
              {round(h.windSpeed)} {units.windUnit}
            </span>
          )}
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

/* ── Full Dashboard ───────────────────────────────────────────────────── */

const BG_GRADIENT = {
  wb_sunny: 'linear-gradient(170deg, #0d2b4e 0%, #1a5276 40%, #2874a6 100%)',
  cloud: 'linear-gradient(170deg, #1a2a3a 0%, #1f3a52 40%, #2a5070 100%)',
  foggy: 'linear-gradient(170deg, #1e2d3a 0%, #2a3d50 40%, #3a5268 100%)',
  grain: 'linear-gradient(170deg, #0e1f30 0%, #1a3448 40%, #234b69 100%)',
  water_drop: 'linear-gradient(170deg, #0a1929 0%, #0d2b45 40%, #1a4060 100%)',
  ac_unit: 'linear-gradient(170deg, #0e2030 0%, #1a3550 40%, #204a6e 100%)',
  thunderstorm: 'linear-gradient(170deg, #0a0f1e 0%, #141e33 40%, #1e2d4a 100%)',
};

const LocationBadge = ({ name }) =>
  name ? (
    <div className="weather-location-badge">
      <span className="material-icons weather-location-icon">location_on</span>
      <span className="weather-location-name">{name}</span>
    </div>
  ) : null;
LocationBadge.propTypes = { name: PropTypes.string };

const WeatherFull = ({ current, hourly, daily, units, locationName }) => {
  const today = daily[0];
  const precipitation = today.precipitation || 0;
  const visKm = hourly[0]?.visibility ? round(hourly[0].visibility / 1000) : null;
  const feelsLike = round(current.apparentTemperature);
  const uvVal = today.uvIndexMax ?? '—';
  const uvLabel =
    uvVal === '—'
      ? ''
      : uvVal < 3
        ? 'Low'
        : uvVal < 6
          ? 'Moderate'
          : uvVal < 8
            ? 'High'
            : 'Very High';

  // For temp range bars: compute span across all days
  const allMin = Math.min(...daily.map((d) => d.tempMin));
  const allMax = Math.max(...daily.map((d) => d.tempMax));
  const span = allMax - allMin || 1;

  const bg = BG_GRADIENT[current.icon] || BG_GRADIENT.cloud;

  return (
    <div className="weather-full" style={{ background: bg }}>
      {/* ══ TOP: Hero + 10-Day ══ */}
      <div className="weather-full-top">
        {/* Hero */}
        <div className="weather-full-hero">
          <div className="weather-full-hero-temp">
            {round(current.temperature)}
            <span className="weather-full-hero-unit">{units.tempUnit}</span>
          </div>
          <div className="weather-full-hero-desc">{current.description}</div>
          {locationName && (
            <div className="weather-full-hero-location">
              <span className="material-icons weather-full-hero-location-icon">location_on</span>
              {locationName}
            </div>
          )}
          <div className="weather-full-hero-hilow">
            H:{round(today.tempMax)}
            {units.tempUnit}&nbsp;&nbsp;L:{round(today.tempMin)}
            {units.tempUnit}
          </div>
          <WeatherIcon name={current.icon} className="weather-full-hero-icon" />
        </div>

        {/* 10-Day */}
        <div className="weather-full-tenday">
          <div className="weather-full-tenday-title">10-DAY FORECAST</div>
          {daily.map((d, i) => {
            const lo = ((d.tempMin - allMin) / span) * 100;
            const width = ((d.tempMax - d.tempMin) / span) * 100;
            return (
              <div key={d.date} className="weather-full-tenday-row">
                <span className="weather-full-tenday-day">
                  {i === 0 ? 'Today' : formatDay(d.date)}
                </span>
                <WeatherIcon name={d.icon} className="weather-full-tenday-icon" />
                <span className="weather-full-tenday-lo">{round(d.tempMin)}°</span>
                <div className="weather-full-tenday-bar">
                  <div
                    className="weather-full-tenday-bar-fill"
                    style={{ left: `${lo}%`, width: `${width}%` }}
                  />
                </div>
                <span className="weather-full-tenday-hi">{round(d.tempMax)}°</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ HOURLY STRIP ══ */}
      <div className="weather-full-hourly">
        <div className="weather-full-hourly-scroll">
          {hourly.slice(0, 24).map((h, i) => (
            <div key={h.time} className="weather-full-hourly-item">
              <span className="weather-full-hourly-time">
                {i === 0 ? 'Now' : formatHour(h.time)}
              </span>
              <WeatherIcon name={h.icon} className="weather-full-hourly-icon" />
              <span className="weather-full-hourly-temp">
                {round(h.temperature)}
                {units.tempUnit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ METRIC TILES ══ */}
      <div className="weather-full-metrics">
        <div className="weather-full-tile">
          <div className="weather-full-tile-top">
            <span className="material-icons weather-full-tile-hdr-icon">wb_sunny</span>
            <span className="weather-full-tile-label">UV INDEX</span>
          </div>
          <div className="weather-full-tile-value">{uvVal}</div>
          {uvLabel && <div className="weather-full-tile-sub">{uvLabel}</div>}
        </div>

        <div className="weather-full-tile">
          <div className="weather-full-tile-top">
            <span
              className="material-icons weather-full-tile-hdr-icon"
              style={{ color: '#FF8F00' }}
            >
              wb_twilight
            </span>
            <span className="weather-full-tile-label">SUNRISE</span>
          </div>
          <div className="weather-full-tile-value">{formatTime(today.sunrise)}</div>
          <div className="weather-full-tile-sub">Sunset {formatTime(today.sunset)}</div>
        </div>

        <div className="weather-full-tile">
          <div className="weather-full-tile-top">
            <span className="material-icons weather-full-tile-hdr-icon">air</span>
            <span className="weather-full-tile-label">WIND</span>
          </div>
          <div className="weather-full-tile-value">
            {round(current.windSpeed)}
            <span className="weather-full-tile-unit"> {units.windUnit}</span>
          </div>
          {current.windDirection != null && (
            <div className="weather-full-tile-sub">{current.windDirection}° bearing</div>
          )}
        </div>

        <div className="weather-full-tile">
          <div className="weather-full-tile-top">
            <span className="material-icons weather-full-tile-hdr-icon">water_drop</span>
            <span className="weather-full-tile-label">PRECIPITATION</span>
          </div>
          <div className="weather-full-tile-value">
            {precipitation}
            <span className="weather-full-tile-unit"> {units.precipUnit}</span>
          </div>
          <div className="weather-full-tile-sub">Today</div>
        </div>

        <div className="weather-full-tile">
          <div className="weather-full-tile-top">
            <span
              className="material-icons weather-full-tile-hdr-icon"
              style={{ color: '#EF5350' }}
            >
              thermostat
            </span>
            <span className="weather-full-tile-label">FEELS LIKE</span>
          </div>
          <div className="weather-full-tile-value">
            {feelsLike}
            <span className="weather-full-tile-unit">{units.tempUnit}</span>
          </div>
          <div className="weather-full-tile-sub">
            {feelsLike < round(current.temperature) ? 'Feels colder' : 'Feels warmer'}
          </div>
        </div>

        <div className="weather-full-tile">
          <div className="weather-full-tile-top">
            <span className="material-icons weather-full-tile-hdr-icon">water</span>
            <span className="weather-full-tile-label">HUMIDITY</span>
          </div>
          <div className="weather-full-tile-value">
            {current.humidity}
            <span className="weather-full-tile-unit">%</span>
          </div>
        </div>

        {visKm !== null && (
          <div className="weather-full-tile">
            <div className="weather-full-tile-top">
              <span className="material-icons weather-full-tile-hdr-icon">visibility</span>
              <span className="weather-full-tile-label">VISIBILITY</span>
            </div>
            <div className="weather-full-tile-value">
              {visKm}
              <span className="weather-full-tile-unit"> km</span>
            </div>
            <div className="weather-full-tile-sub">
              {visKm > 10 ? 'Clear' : visKm > 5 ? 'Average' : 'Poor'}
            </div>
          </div>
        )}

        <div className="weather-full-tile">
          <div className="weather-full-tile-top">
            <span className="material-icons weather-full-tile-hdr-icon">speed</span>
            <span className="weather-full-tile-label">PRESSURE</span>
          </div>
          <div className="weather-full-tile-value">
            {round(current.pressure)}
            <span className="weather-full-tile-unit"> hPa</span>
          </div>
        </div>
      </div>
    </div>
  );
};

WeatherFull.propTypes = {
  current: PropTypes.object.isRequired,
  hourly: PropTypes.array.isRequired,
  daily: PropTypes.array.isRequired,
  units: PropTypes.object.isRequired,
  locationName: PropTypes.string,
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
  const { data, isLoading, isError, locationName } = useWeather();
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
        <span className="weather-error-text">Failed to fetch weather</span>
      </div>
    );
  }

  const { current, hourly, daily, units } = data;
  const today = daily[0];

  if (mode === 'full') {
    return <WeatherFull current={current} hourly={hourly} daily={daily} units={units} locationName={locationName} />;
  }

  return (
    <div className="weather-container">
      <LocationBadge name={locationName} />
      {/* Current */}
      {mode === 'current' && (
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
      {mode === 'hourly' && (
        <HourlyForecast hourly={hourly.slice(0, hours)} units={units} showWind={showWind} />
      )}

      {/* Daily */}
      {mode === 'daily' && (
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
