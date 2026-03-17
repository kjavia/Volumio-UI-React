import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import usePluginConfig from './usePluginConfig';

const fetchImages = async (url, apiKey) => {
  if (!url) return [];

  const config = { responseType: 'arraybuffer' };
  if (apiKey) {
    config.headers = { Authorization: `Client-ID ${apiKey}` };
  }

  const { data, headers } = await axios.get(url, config);
  const contentType = headers['content-type'] || '';

  if (contentType.includes('application/json')) {
    const json = JSON.parse(new TextDecoder().decode(data));

    // Unsplash array response
    if (Array.isArray(json)) {
      return json
        .map((p) => p.urls?.regular || p.urls?.full || p.url || p.src?.landscape)
        .filter(Boolean);
    }
    // Single Unsplash photo object
    if (json.urls) {
      return [json.urls.regular || json.urls.full];
    }
    // Generic { results: [...] } wrapper
    if (Array.isArray(json.results)) {
      return json.results.map((p) => p.urls?.regular || p.urls?.full || p.url).filter(Boolean);
    }
    return [];
  }

  // Not JSON — treat original URL as a direct image
  return [url];
};

const useWallpaperImages = (url) => {
  const { data: config } = usePluginConfig();
  const unsplashApiKey = config?.unsplashApiKey ?? '';

  return useQuery({
    queryKey: ['wallpaperImages', url],
    queryFn: () => fetchImages(url, unsplashApiKey),
    enabled: !!url,
    staleTime: 10 * 60 * 1000,
    placeholderData: [],
  });
};

export default useWallpaperImages;
