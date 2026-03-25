import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { VOLUMIO_BASE_URL } from '@/config';

const fetchBrowse = async (uri) => {
  const { data } = await axios.get(`${VOLUMIO_BASE_URL}/api/v1/browse`, {
    params: { uri },
  });
  return data?.navigation ?? null;
};

const useBrowse = (uri) => {
  return useQuery({
    queryKey: ['browse', uri],
    queryFn: () => fetchBrowse(uri),
    enabled: uri != null,
    staleTime: 30_000,
    retry: 2,
  });
};

export default useBrowse;
