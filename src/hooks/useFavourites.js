import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { VOLUMIO_BASE_URL } from '@/config';

const fetchFavourites = async () => {
  const { data } = await axios.get(`${VOLUMIO_BASE_URL}/api/v1/browse`, {
    params: { uri: 'favourites' },
  });
  const items = data?.navigation?.lists?.[0]?.items || [];
  return new Set(items.map((item) => item.uri));
};

const useFavourites = () => {
  const queryClient = useQueryClient();

  const { data: favouritesUris = new Set() } = useQuery({
    queryKey: ['favourites'],
    queryFn: fetchFavourites,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const refetchFavourites = () => {
    queryClient.invalidateQueries({ queryKey: ['favourites'] });
  };

  return { favouritesUris, refetchFavourites };
};

export default useFavourites;
