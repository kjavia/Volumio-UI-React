import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import usePluginConfig from './usePluginConfig';
import useGeoLocation from '@bigdatacloudapi/react-reverse-geocode-client';

const WMO_CODES = {
  0: { description: 'Clear sky', icon: 'wb_sunny' },
  1: { description: 'Mainly clear', icon: 'wb_sunny' },
  2: { description: 'Partly cloudy', icon: 'cloud' },
  3: { description: 'Overcast', icon: 'cloud' },
  45: { description: 'Fog', icon: 'foggy' },
  48: { description: 'Depositing rime fog', icon: 'foggy' },
  51: { description: 'Light drizzle', icon: 'grain' },
  53: { description: 'Moderate drizzle', icon: 'grain' },
  55: { description: 'Dense drizzle', icon: 'grain' },
  56: { description: 'Light freezing drizzle', icon: 'ac_unit' },
  57: { description: 'Dense freezing drizzle', icon: 'ac_unit' },
  61: { description: 'Slight rain', icon: 'water_drop' },
  63: { description: 'Moderate rain', icon: 'water_drop' },
  65: { description: 'Heavy rain', icon: 'water_drop' },
  66: { description: 'Light freezing rain', icon: 'ac_unit' },
  67: { description: 'Heavy freezing rain', icon: 'ac_unit' },
  71: { description: 'Slight snow', icon: 'ac_unit' },
  73: { description: 'Moderate snow', icon: 'ac_unit' },
  75: { description: 'Heavy snow', icon: 'ac_unit' },
  77: { description: 'Snow grains', icon: 'ac_unit' },
  80: { description: 'Slight showers', icon: 'water_drop' },
  81: { description: 'Moderate showers', icon: 'water_drop' },
  82: { description: 'Violent showers', icon: 'water_drop' },
  85: { description: 'Slight snow showers', icon: 'ac_unit' },
  86: { description: 'Heavy snow showers', icon: 'ac_unit' },
  95: { description: 'Thunderstorm', icon: 'thunderstorm' },
  96: { description: 'Thunderstorm with slight hail', icon: 'thunderstorm' },
  99: { description: 'Thunderstorm with heavy hail', icon: 'thunderstorm' },
};

const resolveWmo = (code) => WMO_CODES[code] || { description: 'Unknown', icon: 'help_outline' };

const fetchWeather = async ({ latitude, longitude, unitSystem, weatherApiKey }) => {
  const isImperial = unitSystem === 'imperial';
  const params = {
    latitude,
    longitude,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'weather_code',
      'wind_speed_10m',
      'is_day',
      'surface_pressure',
      'wind_direction_10m',
    ].join(','),
    hourly: [
      'temperature_2m',
      'weather_code',
      'wind_speed_10m',
      'relative_humidity_2m',
      'visibility',
      'uv_index',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'wind_speed_10m_max',
      'precipitation_sum',
      'uv_index_max',
    ].join(','),
    temperature_unit: isImperial ? 'fahrenheit' : 'celsius',
    wind_speed_unit: isImperial ? 'mph' : 'kmh',
    precipitation_unit: isImperial ? 'inch' : 'mm',
    forecast_days: 10,
    timezone: 'auto',
  };

  if (weatherApiKey) {
    params.apikey = weatherApiKey;
  }

  const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', { params });

  const c = data.current;
  const wmo = resolveWmo(c.weather_code);
  const tempUnit = isImperial ? '°F' : '°C';
  const windUnit = isImperial ? 'mph' : 'km/h';
  const precipUnit = isImperial ? 'in' : 'mm';

  // Current
  const current = {
    temperature: c.temperature_2m,
    apparentTemperature: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    windSpeed: c.wind_speed_10m,
    windDirection: c.wind_direction_10m,
    pressure: c.surface_pressure,
    weatherCode: c.weather_code,
    description: wmo.description,
    icon: wmo.icon,
    isDay: c.is_day === 1,
    timestamp: c.time,
  };

  // Hourly (next 24h from current hour)
  const h = data.hourly;
  const nowIso = c.time;
  const startIdx = h.time.findIndex((t) => t >= nowIso);
  const hourly = h.time.slice(startIdx, startIdx + 24).map((t, i) => {
    const idx = startIdx + i;
    const hw = resolveWmo(h.weather_code[idx]);
    return {
      time: t,
      temperature: h.temperature_2m[idx],
      weatherCode: h.weather_code[idx],
      description: hw.description,
      icon: hw.icon,
      windSpeed: h.wind_speed_10m[idx],
      humidity: h.relative_humidity_2m[idx],
      visibility: h.visibility ? h.visibility[idx] : 0,
      uvIndex: h.uv_index ? h.uv_index[idx] : 0,
    };
  });

  // Daily (up to 10 days)
  const d = data.daily;
  const daily = d.time.map((t, i) => {
    const dw = resolveWmo(d.weather_code[i]);
    return {
      date: t,
      tempMax: d.temperature_2m_max[i],
      tempMin: d.temperature_2m_min[i],
      weatherCode: d.weather_code[i],
      description: dw.description,
      icon: dw.icon,
      sunrise: d.sunrise[i],
      sunset: d.sunset[i],
      windSpeedMax: d.wind_speed_10m_max[i],
      precipitation: d.precipitation_sum[i],
      uvIndexMax: d.uv_index_max ? d.uv_index_max[i] : 0,
      tempMin: d.temperature_2m_min[i],
      sunrise: d.sunrise[i],
      sunset: d.sunset[i],
      windSpeedMax: d.wind_speed_10m_max[i],
      precipitation: d.precipitation_sum[i],
    };
  });

  return {
    current,
    hourly,
    daily,
    units: { tempUnit, windUnit, precipUnit },
    unitSystem: isImperial ? 'imperial' : 'metric',
  };
};

const useWeather = () => {
  const { data: config, isLoading: configLoading } = usePluginConfig();
  const { data: geoData } = useGeoLocation();
  const latitude = config?.latitude || geoData?.latitude;
  const longitude = config?.longitude || geoData?.longitude;
  const unitSystem = config?.unitSystem || 'metric';
  const weatherApiKey = config?.weatherApiKey || '';
  const hasLocation = Boolean(latitude) && Boolean(longitude);
  const locationName =
    geoData?.city ||
    geoData?.locality ||
    geoData?.principalSubdivision ||
    geoData?.countryName ||
    null;

  const query = useQuery({
    queryKey: ['weather', latitude, longitude, unitSystem],
    queryFn: () => fetchWeather({ latitude, longitude, unitSystem, weatherApiKey }),
    enabled: !configLoading && hasLocation,
    staleTime: 4 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { ...query, locationName };
};

export { WMO_CODES };
export default useWeather;
