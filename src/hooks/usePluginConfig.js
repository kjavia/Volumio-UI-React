import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { PLUGIN_BASE_URL } from '@/config';

const fetchPluginConfig = async () => {
  const { data } = await axios.get(`${PLUGIN_BASE_URL}/api/config`);
  return data;
};

const usePluginConfig = () => {
  return useQuery({
    queryKey: ['pluginConfig'],
    queryFn: fetchPluginConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export default usePluginConfig;
