import { useMemo } from 'react';
import useBrowse from './useBrowse';

// Albums — reuses the same useBrowse hook that powers BrowseDialog.
// URI 'albums://' is the same one used by the Browse tile for Albums.
export const useAlbums = () => {
  const { data, isLoading, isError } = useBrowse('albums://');

  const albums = useMemo(() => {
    const lists = data?.lists ?? [];
    return lists
      .flatMap((list) => list.items ?? [])
      .filter((item) => item.uri && item.title)
      .map((item) => ({
        title: item.title,
        artist: item.artist ?? '',
        uri: item.uri,
        service: item.service ?? 'mpd',
        year: item.year ?? null,
        albumart: item.albumart ?? null,
      }));
  }, [data]);

  return { data: albums, isLoading, isError };
};

// Album tracks — browse into a specific album URI, same as BrowseDialog navigation.
export const useAlbumTracks = (albumUri) => {
  const { data, isLoading, isError } = useBrowse(albumUri ?? null);

  const tracks = useMemo(() => {
    if (!albumUri) return [];
    const lists = data?.lists ?? [];
    return lists
      .flatMap((list) => list.items ?? [])
      .filter((item) => item.type === 'song')
      .map((item) => ({
        title: item.title,
        artist: item.artist ?? '',
        album: item.album ?? '',
        uri: item.uri,
        service: item.service ?? 'mpd',
        albumart: item.albumart ?? null,
        duration: item.duration ?? null,
        trackNumber: item.tracknumber ?? null,
      }));
  }, [data, albumUri]);

  return { data: tracks, isLoading, isError };
};
