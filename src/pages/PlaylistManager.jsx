import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import PropTypes from 'prop-types';
import { useAlbums, useAlbumTracks } from '@/hooks/useAlbums';
import usePlaylists from '@/hooks/usePlaylists';
import useBrowse from '@/hooks/useBrowse';
import useFavourites from '@/hooks/useFavourites';
import useVolumioStatus from '@/hooks/useVolumioStatus';
import { normalizeUri } from '@/hooks/useVolumioStatus';
import useToast from '@/hooks/useToast';
import { VOLUMIO_BASE_URL } from '@/config';
import { useSocket } from '@/contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import Toast from '@/components/Toast';
import './playlist-manager.scss';

// ─── Album List (col 1) ───────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'title', label: 'Name' },
  { value: 'artist', label: 'Artist' },
  { value: 'year', label: 'Year' },
];

const AlbumList = ({ selectedAlbumUri, onSelect }) => {
  const { data: albums = [], isLoading } = useAlbums();
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const parentRef = useRef(null);

  const resolveArt = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${VOLUMIO_BASE_URL}${url}`;
  };

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return albums
      .filter((a) => !q || a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortBy === 'year') return (a.year ?? 0) - (b.year ?? 0);
        const av = (a[sortBy] ?? '').toString().toLowerCase();
        const bv = (b[sortBy] ?? '').toString().toLowerCase();
        return av < bv ? -1 : av > bv ? 1 : 0;
      });
  }, [albums, filter, sortBy]);

  const selectedIndex = useMemo(
    () => filtered.findIndex((a) => a.uri === selectedAlbumUri),
    [filtered, selectedAlbumUri]
  );

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 8,
    enabled: viewMode === 'list',
  });

  // Scroll selected album into view using virtualizer in list mode
  useEffect(() => {
    if (viewMode !== 'list' || selectedIndex < 0) return;
    virtualizer.scrollToIndex(selectedIndex, { align: 'center', behavior: 'smooth' });
  }, [selectedIndex, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pm-column pm-column--albums">
      <div className="pm-column__header">
        <h2 className="pm-column__title">
          Albums
          {!isLoading && (
            <span className="pm-count">
              {filter ? `${filtered.length}/${albums.length}` : albums.length}
            </span>
          )}
        </h2>
        <div className="pm-toolbar">
          <div className="input-group">
            <span className="input-group-text">
              <span className="material-icons">search</span>
            </span>
            <input
              className="form-control"
              type="text"
              placeholder="Filter albums…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <button className="btn btn-secondary" type="button" onClick={() => setFilter('')}>
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
          <select
            className="form-select pm-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            className="btn btn-sm btn-secondary"
            title={viewMode === 'list' ? 'Switch to grid view' : 'Switch to list view'}
            onClick={() => setViewMode((v) => v === 'list' ? 'grid' : 'list')}
          >
            <span className="material-icons">{viewMode === 'list' ? 'grid_view' : 'view_list'}</span>
          </button>
        </div>
      </div>

      <div className="pm-column__body" ref={parentRef}>
        {isLoading && <div className="pm-loading">Loading albums…</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="pm-empty">No albums found.</div>
        )}

        {viewMode === 'list' ? (
          <ul
            className="pm-album-list pm-album-list--list"
            style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const album = filtered[virtualItem.index];
              return (
                <li
                  key={album.uri}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  className={`pm-album-item${album.uri === selectedAlbumUri ? ' pm-album-item--active' : ''}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                  onClick={() => onSelect(album.uri)}
                >
                  <img
                    className="pm-album-item__thumb"
                    src={resolveArt(album.albumart) || '/assets/images/default-albumart.png'}
                    alt=""
                    loading="lazy"
                  />
                  <div className="pm-album-item__text">
                    <div className="pm-album-item__title">{album.title}</div>
                    <div className="pm-album-item__meta">
                      {album.artist}
                      {album.year ? ` · ${album.year}` : ''}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="pm-album-list pm-album-list--grid">
            {filtered.map((album) => (
              <li
                key={album.uri}
                className={`pm-album-item${album.uri === selectedAlbumUri ? ' pm-album-item--active' : ''}`}
                title={`${album.title}${album.artist ? ` — ${album.artist}` : ''}${album.year ? ` (${album.year})` : ''}`}
                onClick={() => onSelect(album.uri)}
              >
                <img
                  className="pm-album-item__thumb"
                  src={resolveArt(album.albumart) || '/assets/images/default-albumart.png'}
                  alt=""
                  loading="lazy"
                />
                <div className="pm-album-item__text">
                  <div className="pm-album-item__title">{album.title}</div>
                  <div className="pm-album-item__meta">
                    {album.artist}
                    {album.year ? ` · ${album.year}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

AlbumList.propTypes = {
  selectedAlbumUri: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

// ─── Track List (col 2) ───────────────────────────────────────────────────────

const TrackList = ({ albumUri, selectedTracks, onToggleTrack, onToggleFavourites, favouritesUris = new Set(), playlistNormUris = new Set(), socket }) => {
  const { data: tracks = [], isLoading } = useAlbumTracks(albumUri);
  const { isPlaying, queue, position, togglePlay } = useVolumioStatus();
  const nowPlayingUri = queue[position]?.uri ?? null;
  const nowPlayingNorm = normalizeUri(nowPlayingUri);
  const playingItemRef = useRef(null);
  const [trackFilter, setTrackFilter] = useState('');

  // Clear filter when album changes
  useEffect(() => { setTrackFilter(''); }, [albumUri]);

  const normFavUris = useMemo(
    () => new Set([...favouritesUris].map(normalizeUri)),
    [favouritesUris]
  );
  const visibleTracks = useMemo(
    () => {
      const q = trackFilter.toLowerCase();
      return tracks.filter((t) => {
        const n = normalizeUri(t.uri);
        if (normFavUris.has(n) || playlistNormUris.has(n)) return false;
        if (!q) return true;
        return t.title.toLowerCase().includes(q) || (t.artist ?? '').toLowerCase().includes(q);
      });
    },
    [tracks, normFavUris, playlistNormUris, trackFilter]
  );

  const discCount = useMemo(
    () => new Set(tracks.map((t) => t.discNumber).filter(Boolean)).size,
    [tracks]
  );

  // Scroll the currently playing track into view when tracks load or the playing track changes
  useEffect(() => {
    if (playingItemRef.current) {
      playingItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [nowPlayingNorm, visibleTracks]);

  const allSelected = visibleTracks.length > 0 && visibleTracks.every((t) => selectedTracks.has(t.uri));

  const toggleAll = useCallback(() => {
    visibleTracks.forEach((t) => onToggleTrack(t, !allSelected));
  }, [visibleTracks, allSelected, onToggleTrack]);

  const favCount = selectedTracks.size;

  const handlePlayTrack = useCallback((e, track) => {
    e.stopPropagation();
    const isThisTrack = normalizeUri(track.uri) === nowPlayingNorm;
    if (isThisTrack) {
      togglePlay();
    } else {
      socket?.emit('replaceAndPlay', {
        uri: track.uri,
        service: track.service,
        title: track.title,
        artist: track.artist,
        album: track.album,
        albumart: track.albumart,
        type: 'song',
      });
    }
  }, [socket, nowPlayingNorm, togglePlay]);

  return (
    <div className="pm-column pm-column--tracks">
      <div className="pm-column__header">
        <h2 className="pm-column__title">
          Tracks
          {albumUri && !isLoading && (
            <span className="pm-count">{visibleTracks.length}</span>
          )}
        </h2>
        <div className="pm-toolbar pm-toolbar--tracks">
          <div className="input-group">
            <span className="input-group-text">
              <span className="material-icons">search</span>
            </span>
            <input
              className="form-control"
              type="text"
              placeholder="Filter tracks…"
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
            />
            {trackFilter && (
              <button className="btn btn-secondary" type="button" onClick={() => setTrackFilter('')}>
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
          <button
            className="btn btn-sm btn-secondary d-flex align-items-center gap-3"
            title="Toggle selected tracks as Favourites"
            disabled={favCount === 0}
            onClick={() => onToggleFavourites([...selectedTracks.values()])}
          >
            <span className="material-icons">favorite</span>
            {favCount > 0 && <span>{` (${favCount})`}</span>}
          </button>
        </div>
      </div>

      <div className="pm-column__body">
        {!albumUri && <div className="pm-empty">Select an album to see its tracks.</div>}
        {albumUri && isLoading && <div className="pm-loading">Loading tracks…</div>}
        {albumUri && !isLoading && visibleTracks.length === 0 && (
          <div className="pm-empty">
            {tracks.length > 0 ? 'All tracks are already in Favourites or the selected playlist.' : 'No tracks available.'}
          </div>
        )}
        {visibleTracks.length > 0 && (
          <>
            <div className="pm-track-selectall">
              <label className="pm-checkbox-label">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                <span>{allSelected ? 'Deselect all' : 'Select all'}</span>
              </label>
            </div>
            <ul className="pm-track-list">
              {visibleTracks.map((track) => (
                <li
                  key={track.uri}
                  ref={normalizeUri(track.uri) === nowPlayingNorm ? playingItemRef : null}
                  className={[
                    'pm-track-item',
                    selectedTracks.has(track.uri) ? 'pm-track-item--selected' : '',
                    normalizeUri(track.uri) === nowPlayingNorm ? 'pm-track-item--playing' : '',
                  ].filter(Boolean).join(' ')}
                  draggable
                  onDragStart={(e) => {
                    // Carry all selected track objects (or just this one if not selected)
                    const payload = selectedTracks.has(track.uri)
                      ? [...selectedTracks.entries()].map(([uri]) => {
                        return tracks.find((t) => t.uri === uri) ?? { uri };
                      })
                      : [track];
                    e.dataTransfer.setData('application/json', JSON.stringify(payload));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                >
                  <label className="pm-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedTracks.has(track.uri)}
                      onChange={() => onToggleTrack(track, !selectedTracks.has(track.uri))}
                    />
                  </label>
                  <div className="pm-track-item__info">
                    {discCount > 1 && track.discNumber && (
                      <span className="pm-track-item__disc-badge">CD {track.discNumber}</span>
                    )}
                    <span className="pm-track-item__title">{track.title}</span>
                    {track.artist && (
                      <span className="pm-track-item__artist">{track.artist}</span>
                    )}
                  </div>
                  <button
                    className="btn btn-sm btn-link pm-track-item__play"
                    title={normalizeUri(track.uri) === nowPlayingNorm && isPlaying ? 'Pause' : 'Play'}
                    onClick={(e) => handlePlayTrack(e, track)}
                  >
                    <span className="material-icons">
                      {normalizeUri(track.uri) === nowPlayingNorm && isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                  </button>
                  <span className="pm-track-item__drag material-icons">drag_indicator</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

TrackList.propTypes = {
  albumUri: PropTypes.string,
  selectedTracks: PropTypes.instanceOf(Map).isRequired,
  onToggleTrack: PropTypes.func.isRequired,
  onToggleFavourites: PropTypes.func.isRequired,
  favouritesUris: PropTypes.instanceOf(Set),
  playlistNormUris: PropTypes.instanceOf(Set),
  socket: PropTypes.object,
};

// ─── Playlist Column (col 3) ──────────────────────────────────────────────────

const PlaylistColumn = ({ onTracksAdded, onToast, selectedPlaylist, onSelectPlaylist }) => {
  const { playlists, isLoading: playlistsLoading } = usePlaylists();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { isPlaying, queue, position } = useVolumioStatus();
  const nowPlayingUri = queue[position]?.uri ?? null;
  const nowPlayingNorm = normalizeUri(nowPlayingUri);
  const playingItemRef = useRef(null);
  const [newName, setNewName] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Auto-select the first playlist once loaded
  useEffect(() => {
    if (!selectedPlaylist && playlists.length > 0) {
      onSelectPlaylist(playlists[0].name);
    }
  }, [playlists, selectedPlaylist, onSelectPlaylist]);

  // Browse the selected playlist's tracks
  const selectedPlaylistObj = playlists.find((p) => p.name === selectedPlaylist);
  const playlistBrowseUri = selectedPlaylistObj?.uri ?? null;
  const { data: tracksNav, isLoading: tracksLoading } = useBrowse(playlistBrowseUri);
  const playlistTracks = tracksNav?.lists?.[0]?.items ?? [];

  // Scroll to the playing track once playlist tracks load
  useEffect(() => {
    if (playingItemRef.current) {
      playingItemRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [nowPlayingNorm, playlistTracks]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!socket || !selectedPlaylist) return;
    let tracks;
    try {
      tracks = JSON.parse(e.dataTransfer.getData('application/json'));
    } catch {
      return;
    }
    if (!tracks?.length) return;
    tracks.forEach((track) => {
      socket.emit('addToPlaylist', {
        name: selectedPlaylist,
        uri: track.uri,
        service: track.service ?? 'mpd',
      });
    });
    onTracksAdded?.();
    onToast?.(`Added ${tracks.length} track${tracks.length !== 1 ? 's' : ''} to "${selectedPlaylist}"`);
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['browse', playlistBrowseUri] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    }, 800);
  };

  const handleRemoveTrack = useCallback((track) => {
    if (!socket || !selectedPlaylist) return;
    socket.emit('removeFromPlaylist', {
      name: selectedPlaylist,
      uri: track.uri,
      service: track.service ?? 'mpd',
    });
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['browse', playlistBrowseUri] });
    }, 500);
  }, [socket, selectedPlaylist, queryClient, playlistBrowseUri]);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name || !socket) return;
    setIsCreating(true);
    socket.emit('createPlaylist', { name });
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      setIsCreating(false);
      setNewName('');
      setCreatingNew(false);
      onSelectPlaylist(name);
    }, 800);
  };

  return (
    <div
      className={`pm-column pm-column--playlists${isDragOver ? ' pm-column--dragover' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false); }}
      onDrop={handleDrop}
    >
      <div className="pm-column__header">
        <h2 className="pm-column__title">
          Playlist
          {playlistTracks.length > 0 && (
            <span className="pm-count">{playlistTracks.length}</span>
          )}
        </h2>
        <div className="pm-toolbar">
          <select
            className="form-select pm-sort-select pm-playlist-select"
            value={selectedPlaylist}
            onChange={(e) => onSelectPlaylist(e.target.value)}
            disabled={playlistsLoading || playlists.length === 0}
          >
            {playlists.length === 0 && <option value="">No playlists</option>}
            {playlists.map((pl) => (
              <option key={pl.name} value={pl.name}>{pl.name}</option>
            ))}
          </select>
          <button
            className="btn btn-sm btn-secondary"
            title="New playlist"
            onClick={() => setCreatingNew((v) => !v)}
          >
            <span className="material-icons">add</span>
          </button>
        </div>
      </div>

      {creatingNew && (
        <div className="pm-new-playlist">
          <input
            className="pm-new-playlist__input"
            type="text"
            placeholder="Playlist name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={isCreating || !newName.trim()}
          >
            {isCreating ? 'Creating…' : 'Create'}
          </button>
          <button className="btn btn-secondary" onClick={() => setCreatingNew(false)}>Cancel</button>
        </div>
      )}

      <div className="pm-column__body">
        {(playlistsLoading || tracksLoading) && <div className="pm-loading">Loading…</div>}
        {!playlistsLoading && playlists.length === 0 && (
          <div className="pm-empty">No playlists yet. Create one above.</div>
        )}
        {!tracksLoading && selectedPlaylist && playlistTracks.length === 0 && (
          <div className="pm-empty pm-empty--drop">
            <span className="material-icons">playlist_add</span>
            Drop tracks here to add to &ldquo;{selectedPlaylist}&rdquo;
          </div>
        )}
        <ul className="pm-playlist-track-list">
          {playlistTracks.map((track, idx) => {
            const isThisPlaying = normalizeUri(track.uri) === nowPlayingNorm;
            return (
              <li
                key={`${track.uri}-${idx}`}
                ref={isThisPlaying ? playingItemRef : null}
                className={`pm-playlist-track-item${isThisPlaying ? ' pm-playlist-track-item--playing' : ''}`}
              >
                <span className="pm-playlist-track-item__num">{idx + 1}</span>
                <div className="pm-track-item__info">
                  <span className="pm-track-item__title">{track.title}</span>
                  {track.artist && (
                    <span className="pm-track-item__artist">{track.artist}</span>
                  )}
                </div>
                {isThisPlaying && (
                  <span className="material-icons pm-playlist-track-item__playing-icon">
                    {isPlaying ? 'volume_up' : 'pause'}
                  </span>
                )}
                <button
                  className="btn btn-sm btn-link pm-track-item__remove"
                  title="Remove from playlist"
                  onClick={() => handleRemoveTrack(track)}
                >
                  <span className="material-icons">remove_circle_outline</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

PlaylistColumn.propTypes = {
  selectedTracks: PropTypes.instanceOf(Map).isRequired,
  onTracksAdded: PropTypes.func,
  onToast: PropTypes.func,
  selectedPlaylist: PropTypes.string.isRequired,
  onSelectPlaylist: PropTypes.func.isRequired,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const PlaylistManager = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { refetchFavourites, favouritesUris } = useFavourites();
  const { toasts, showToast } = useToast();

  const [selectedAlbumUri, setSelectedAlbumUri] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');

  // Fetch the selected playlist's tracks to filter the track list
  const { playlists } = usePlaylists();
  const selectedPlaylistObj = playlists.find((p) => p.name === selectedPlaylist);
  const { data: playlistTracksNav } = useBrowse(selectedPlaylistObj?.uri ?? null);
  const playlistNormUris = useMemo(() => {
    const items = playlistTracksNav?.lists?.[0]?.items ?? [];
    return new Set(items.map((t) => normalizeUri(t.uri)));
  }, [playlistTracksNav]);

  // Auto-select the album of the currently playing track on first load
  const { queue, position } = useVolumioStatus();
  const { data: albums } = useAlbums();
  const nowPlayingAlbumName = queue[position]?.album ?? null;
  useEffect(() => {
    if (selectedAlbumUri !== null) return;
    if (!nowPlayingAlbumName || !albums?.length) return;
    const match = albums.find((a) => a.title === nowPlayingAlbumName);
    if (match) setSelectedAlbumUri(match.uri);
  }, [albums, nowPlayingAlbumName, selectedAlbumUri]);
  // Map<uri, track> — preserves insertion order for drag payloads
  const [selectedTracks, setSelectedTracks] = useState(new Map());

  // Resizable columns — [col1, col2, col3] pixel widths, null = use CSS default
  const [colSizes, setColSizes] = useState([null, null, null]);
  const gridRef = useRef(null);

  const gridTemplateColumns = useMemo(() => {
    const [c1, c2, c3] = colSizes;
    return `${c1 != null ? c1 + 'px' : '1fr'} 5px ${c2 != null ? c2 + 'px' : '1fr'} 5px ${c3 != null ? c3 + 'px' : '1fr'}`;
  }, [colSizes]);

  const startResize = useCallback((e, handleIdx) => {
    e.preventDefault();
    const grid = gridRef.current;
    if (!grid) return;
    // getComputedStyle gives resolved pixel widths for all 5 tracks [c1, h, c2, h, c3]
    const trackWidths = getComputedStyle(grid).gridTemplateColumns.split(' ').map(parseFloat);
    const startX = e.clientX;
    const startLeft = trackWidths[handleIdx * 2];
    const startRight = trackWidths[(handleIdx + 1) * 2];
    const onMove = (ev) => {
      const delta = ev.clientX - startX;
      setColSizes((prev) => {
        const next = [...prev];
        next[handleIdx] = Math.max(140, startLeft + delta);
        next[handleIdx + 1] = Math.max(140, startRight - delta);
        return next;
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const handleSelectAlbum = (uri) => {
    setSelectedAlbumUri(uri);
    setSelectedTracks(new Map()); // clear selection when album changes
  };

  const handleToggleTrack = useCallback((track, selected) => {
    setSelectedTracks((prev) => {
      const next = new Map(prev);
      if (selected) next.set(track.uri, track);
      else next.delete(track.uri);
      return next;
    });
  }, []);

  const handleToggleFavourites = useCallback(
    (uris) => {
      if (!socket) return;
      uris.forEach((uri) => {
        const track = selectedTracks.get(uri);
        if (!track) return;
        if (favouritesUris.has(uri)) {
          socket.emit('removeFromFavourites', { uri, service: track.service });
        } else {
          socket.emit('addToFavourites', {
            uri,
            title: track.title,
            artist: track.artist,
            album: track.album,
            albumart: track.albumart,
            service: track.service,
          });
        }
      });
      setTimeout(refetchFavourites, 800);
    },
    [socket, selectedTracks, favouritesUris, refetchFavourites],
  );

  return (
    <div className="playlist-manager">
      <div className="pm-topbar">
        <button className="btn btn-link pm-back-btn" onClick={() => navigate(-1)}>
          <span className="material-icons">arrow_back</span>
        </button>
        <h1 className="pm-topbar__title">Playlist Manager</h1>
      </div>

      <div className="pm-grid" ref={gridRef} style={{ gridTemplateColumns }}>
        <AlbumList selectedAlbumUri={selectedAlbumUri} onSelect={handleSelectAlbum} />
        <div className="pm-resize-handle" onMouseDown={(e) => startResize(e, 0)} />
        <TrackList
          albumUri={selectedAlbumUri}
          selectedTracks={selectedTracks}
          onToggleTrack={handleToggleTrack}
          onToggleFavourites={handleToggleFavourites}
          favouritesUris={favouritesUris}
          playlistNormUris={playlistNormUris}
          socket={socket}
        />
        <div className="pm-resize-handle" onMouseDown={(e) => startResize(e, 1)} />
        <PlaylistColumn
          selectedTracks={selectedTracks}
          onTracksAdded={() => setSelectedTracks(new Map())}
          onToast={showToast}
          selectedPlaylist={selectedPlaylist}
          onSelectPlaylist={setSelectedPlaylist}
        />
      </div>
      <Toast toasts={toasts} />
    </div>
  );
};

export default PlaylistManager;
