import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { VOLUMIO_BASE_URL } from '@/config';

const fetchPlaylists = async () => {
  const { data } = await axios.get(`${VOLUMIO_BASE_URL}/api/v1/browse`, {
    params: { uri: 'playlists' },
  });
  const items = data?.navigation?.lists?.[0]?.items || [];
  return items.map((item) => ({
    name: item.title,
    uri: item.uri,
  }));
};

const createPlaylist = async (name) => {
  const { data } = await axios.post(`${VOLUMIO_BASE_URL}/api/v1/commands`, {
    command: 'createPlaylist',
    name,
  });
  return data;
};

const addToPlaylist = async ({ playlistName, uri, service }) => {
  const { data } = await axios.post(`${VOLUMIO_BASE_URL}/api/v1/commands`, {
    command: 'addToPlaylist',
    name: playlistName,
    uri,
    service,
  });
  return data;
};

const usePlaylists = () => {
  const queryClient = useQueryClient();

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: fetchPlaylists,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: createPlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: addToPlaylist,
  });

  return {
    playlists,
    isLoading,
    createPlaylist: createMutation.mutateAsync,
    addToPlaylist: addToPlaylistMutation.mutateAsync,
    isAdding: addToPlaylistMutation.isPending,
    isCreating: createMutation.isPending,
  };
};

export default usePlaylists;
