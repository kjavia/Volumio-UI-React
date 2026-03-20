import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { VOLUMIO_BASE_URL } from '@/config';

const fetchFavourites = async () => {
  try {
    const { data } = await axios.get(`${VOLUMIO_BASE_URL}/api/v1/browse`, {
      params: { uri: 'favourites' },
    });
    const items = data?.navigation?.lists?.[0]?.items || [];
    const uris = new Set(items.map((item) => item.uri));
    return uris;
  } catch (error) {
    console.error('[Favourites] Failed to fetch favourites:', error);
    return new Set();
  }
};

const useFavourites = () => {
  const queryClient = useQueryClient();

  const { data: favouritesUris = new Set(), isLoading, error } = useQuery({
    queryKey: ['favourites'],
    queryFn: fetchFavourites,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const refetchFavourites = () => {
    queryClient.invalidateQueries({ queryKey: ['favourites'] });
  };

  const addFavouriteOptimistic = (uri) => {
    queryClient.setQueryData(['favourites'], (old = new Set()) => {
      const newSet = new Set(old);
      newSet.add(uri);
      return newSet;
    });
  };

  const removeFavouriteOptimistic = (uri) => {
    queryClient.setQueryData(['favourites'], (old = new Set()) => {
      const newSet = new Set(old);
      newSet.delete(uri);
      return newSet;
    });
  };

  return {
    favouritesUris,
    refetchFavourites,
    addFavouriteOptimistic,
    removeFavouriteOptimistic,
    isLoading,
    error,
  };
};

export default useFavourites;
