import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { PLUGIN_BASE_URL } from '@/config';
import usePluginConfig from './usePluginConfig';

/**
 * Fetch fanart.tv images for the currently playing artist / album.
 *
 * Returns { data, isLoading, error } where data has shape:
 *   { images: [url...], albumcover: [...], cdart: [...], artistbackground: [...] }
 *
 * The plugin proxies all image URLs through `/api/fanart-tv-image` so the
 * browser never talks to fanart.tv directly (avoids CORS issues, especially
 * for canvas usage in PeppyMeter). We prefix relative proxy URLs with
 * PLUGIN_BASE_URL so they resolve correctly in dev mode too.
 *
 * Only runs when a fanart.tv API key is configured and both artist + album
 * are known. Results are cached in-memory (server also caches for 24h).
 */
const prefixProxy = (url) => {
  if (!url) return url;
  if (url.startsWith('/api/')) return `${PLUGIN_BASE_URL}${url}`;
  return url;
};

const fetchFanartTv = async ({ artist, album }) => {
  if (!artist) return { images: [] };
  const params = new URLSearchParams({ artist });
  if (album) params.set('album', album);
  const { data } = await axios.get(`${PLUGIN_BASE_URL}/api/fanart-tv?${params.toString()}`);
  if (!data) return { images: [] };
  return {
    ...data,
    images: (data.images || []).map(prefixProxy),
    albumcover: (data.albumcover || []).map(prefixProxy),
    cdart: (data.cdart || []).map(prefixProxy),
    artistbackground: (data.artistbackground || []).map(prefixProxy),
  };
};

const useFanartTv = ({ artist, album } = {}) => {
  const { data: config } = usePluginConfig();
  const apiKey = (config?.fanartTvApiKey || '').trim();

  return useQuery({
    queryKey: ['fanart-tv', artist || '', album || ''],
    queryFn: () => fetchFanartTv({ artist, album }),
    enabled: !!apiKey && !!artist,
    staleTime: 60 * 60 * 1000, // 1h
    gcTime: 24 * 60 * 60 * 1000, // 24h
    retry: 1,
    placeholderData: { images: [] },
  });
};

export default useFanartTv;
