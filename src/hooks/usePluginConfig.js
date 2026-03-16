import { useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PLUGIN_BASE_URL } from '@/config';
import { SocketContext } from '@/contexts/SocketContext';

const fetchPluginConfig = async () => {
  const { data } = await axios.get(`${PLUGIN_BASE_URL}/api/config`);
  return data;
};

const usePluginConfig = () => {
  const { socket } = useContext(SocketContext);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleConfigUpdate = () => {
      console.log('Received plugin config update via WebSocket');
      queryClient.invalidateQueries({ queryKey: ['pluginConfig'] });
    };

    socket.on('pushStylishPlayerConfig', handleConfigUpdate);

    return () => {
      socket.off('pushStylishPlayerConfig', handleConfigUpdate);
    };
  }, [socket, queryClient]);

  return useQuery({
    queryKey: ['pluginConfig'],
    queryFn: fetchPluginConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export default usePluginConfig;
