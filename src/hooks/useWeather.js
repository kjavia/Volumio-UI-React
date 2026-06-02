import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useGeoLocation } from '@bigdatacloudapi/react-reverse-geocode-client';
import usePluginConfig from './usePluginConfig';
import { useEffect } from 'react';

// Fetches a city name from lat/lng via BigDataCloud reverse-geocode (free, no key needed).
const fetchCityName = async ({ latitude, longitude, language }) => {
  const { data } = await axios.get(
    'https://api.bigdatacloud.net/data/reverse-geocode-client',
    { params: { latitude, longitude, localityLanguage: language || 'en' } }
  );
  return (
    data.city ||
    data.locality ||
    data.principalSubdivision ||
    data.countryName ||
    null
  );
};

// Given lat/lng (and the Volumio system language), resolves to a city name string.
// Only used when the plugin config has explicit coordinates saved.
const useCityNameFromConfigLocation = (latitude, longitude, language) =>
  useQuery({
    queryKey: ['geo-detect', latitude, longitude, language],
    queryFn: () => fetchCityName({ latitude, longitude, language }),
    enabled: Boolean(latitude) && Boolean(longitude),
    staleTime: Infinity,
    retry: false,
  });

const WMO_CODES = {
  0: { description: 'clear_sky', icon: 'wb_sunny', nightIcon: 'nights_stay' },
  1: { description: 'mainly_clear', icon: 'wb_sunny', nightIcon: 'nights_stay' },
  2: { description: 'partly_cloudy', icon: 'cloud', nightIcon: 'nights_stay' },
  3: { description: 'overcast', icon: 'cloud' },
  45: { description: 'fog', icon: 'foggy' },
  48: { description: 'depositing_rime_fog', icon: 'foggy' },
  51: { description: 'light_drizzle', icon: 'grain' },
  53: { description: 'moderate_drizzle', icon: 'grain' },
  55: { description: 'dense_drizzle', icon: 'grain' },
  56: { description: 'light_freezing_drizzle', icon: 'ac_unit' },
  57: { description: 'dense_freezing_drizzle', icon: 'ac_unit' },
  61: { description: 'slight_rain', icon: 'water_drop' },
  63: { description: 'moderate_rain', icon: 'water_drop' },
  65: { description: 'heavy_rain', icon: 'water_drop' },
  66: { description: 'light_freezing_rain', icon: 'ac_unit' },
  67: { description: 'heavy_freezing_rain', icon: 'ac_unit' },
  71: { description: 'slight_snow', icon: 'ac_unit' },
  73: { description: 'moderate_snow', icon: 'ac_unit' },
  75: { description: 'heavy_snow', icon: 'ac_unit' },
  77: { description: 'snow_grains', icon: 'ac_unit' },
  80: { description: 'slight_showers', icon: 'water_drop' },
  81: { description: 'moderate_showers', icon: 'water_drop' },
  82: { description: 'violent_showers', icon: 'water_drop' },
  85: { description: 'slight_snow_showers', icon: 'ac_unit' },
  86: { description: 'heavy_snow_showers', icon: 'ac_unit' },
  95: { description: 'thunderstorm', icon: 'thunderstorm' },
  96: { description: 'thunderstorm_slight_hail', icon: 'thunderstorm' },
  99: { description: 'thunderstorm_heavy_hail', icon: 'thunderstorm' },
};

const resolveWmo = (code, isDay = true) => {
  const entry = WMO_CODES[code] || { description: 'unknown', icon: 'help_outline' };
  const icon = (!isDay && entry.nightIcon) ? entry.nightIcon : entry.icon;
  return { ...entry, icon };
};

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
      'is_day',
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
  const isDayCurrent = c.is_day === 1;
  const wmo = resolveWmo(c.weather_code, isDayCurrent);
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
    isDay: isDayCurrent,
    timestamp: c.time,
  };

  // Hourly (next 24h from current hour)
  const h = data.hourly;
  const nowIso = c.time;
  const startIdx = h.time.findIndex((t) => t >= nowIso);
  const hourly = h.time.slice(startIdx, startIdx + 24).map((t, i) => {
    const idx = startIdx + i;
    const isDay = h.is_day ? h.is_day[idx] === 1 : true;
    const hw = resolveWmo(h.weather_code[idx], isDay);
    return {
      time: t,
      temperature: h.temperature_2m[idx],
      weatherCode: h.weather_code[idx],
      description: hw.description,
      icon: hw.icon,
      isDay,
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
  const language = config?.language || 'en';
  const configLat = config?.latitude ? Number(config.latitude) : null;
  const configLng = config?.longitude ? Number(config.longitude) : null;
  const hasConfigLocation = Boolean(configLat) && Boolean(configLng);

  // useGeoLocation handles GPS → IP fallback automatically, so it works on
  // Volumio where browser geolocation is unavailable.
  // Pass manual:true so it doesn't fire on mount; we trigger it only when
  // config has loaded and has no explicit coordinates.
  const { data: geoData, loading: geoLoading, refresh: refreshGeo } = useGeoLocation({ language, manual: true });

  useEffect(() => {
    if (!configLoading && !hasConfigLocation) {
      refreshGeo();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configLoading, hasConfigLocation]);

  const latitude = configLat || geoData?.latitude || null;
  const longitude = configLng || geoData?.longitude || null;
  const hasLocation = Boolean(latitude) && Boolean(longitude);

  // True while we're still determining the location (config fetch or geolocation).
  const isLocating = configLoading || (!hasConfigLocation && geoLoading);

  // True when location is definitively unavailable (not just slow).
  const noLocation = !isLocating && !hasLocation;

  const unitSystem = config?.unitSystem || 'metric';
  const weatherApiKey = config?.weatherApiKey || '';

  // When config has explicit coords, reverse-geocode them for the city name.
  // Otherwise use the city name already returned by the geo hook (no extra call).
  const { data: configCityName } = useCityNameFromConfigLocation(
    hasConfigLocation ? configLat : null,
    hasConfigLocation ? configLng : null,
    language
  );
  const cityName = hasConfigLocation
    ? configCityName
    : (geoData?.city || geoData?.locality || geoData?.principalSubdivision || geoData?.countryName || null);

  const query = useQuery({
    queryKey: ['weather', latitude, longitude, unitSystem, weatherApiKey],
    queryFn: () => fetchWeather({ latitude, longitude, unitSystem, weatherApiKey }),
    enabled: !configLoading && hasLocation,
    staleTime: 4 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data, isLoading, isError } = query;

  return { data, isLoading, isError, locationName: cityName || null, isLocating, noLocation };
};

export { WMO_CODES };
export default useWeather;
