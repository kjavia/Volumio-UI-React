import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { VOLUMIO_BASE_URL } from '@/config';

const fetchSearch = async (query) => {
  const { data } = await axios.get(`${VOLUMIO_BASE_URL}/api/v1/search`, {
    params: { query },
  });
  // Volumio returns { navigation: { lists: [...] } }
  return data?.navigation ?? null;
};

const useSearch = (query) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => fetchSearch(query),
    enabled: query.length >= 2,
    staleTime: 60_000,
    retry: 1,
  });
};

export default useSearch;
