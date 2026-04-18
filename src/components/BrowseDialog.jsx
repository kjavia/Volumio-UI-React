import { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import Dialog from './Dialog';
import Button from './Button';
import TrackItem from './TrackItem';
import AddToPlaylistDialog from './AddToPlaylistDialog';
import useBrowse from '@/hooks/useBrowse';
import useSearch from '@/hooks/useSearch';
import useVolumioStatus from '@/hooks/useVolumioStatus';
import { useSocket } from '@/contexts/SocketContext';
import useMenuKeyboard from '@/hooks/useMenuKeyboard';

const BROWSE_TILES = [
  { id: 'favourites', label: 'Favorites', icon: 'favorite', uri: 'favourites' },
  { id: 'playlists', label: 'Playlists', icon: 'queue_music', uri: 'playlists' },
  { id: 'music-library', label: 'Music Library', icon: 'library_music', uri: 'music-library' },
  { id: 'artists', label: 'Artists', icon: 'person', uri: 'artists://' },
  { id: 'albums', label: 'Albums', icon: 'album', uri: 'albums://' },
  { id: 'genres', label: 'Genres', icon: 'category', uri: 'genres://' },
  { id: 'last-100', label: 'Last 100', icon: 'history', uri: 'Last_100' },
  { id: 'web-radio', label: 'Web Radio', icon: 'radio', uri: 'radio' },
];

// Formats total seconds into a human-readable duration string, e.g. "1h 23m" or "45m 12s"
const formatTotalDuration = (totalSecs) => {
  if (!totalSecs) return null;
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

// Maps a (lowercase) format name to its logo path
const FORMAT_LOGO_MAP = {
  flac: '/assets/logos/flac.svg',
  mp3: '/assets/logos/mp3.svg',
  ogg: '/assets/logos/ogg.svg',
  wav: '/assets/logos/wav.svg',
  aiff: '/assets/logos/aiff.svg',
  aif: '/assets/logos/aiff.svg',
  dsd: '/assets/logos/dsd.svg',
  dsf: '/assets/logos/dsd.svg',
  dff: '/assets/logos/dsd.svg',
};

// Known extensions we can recognise for the chip label
const FORMAT_EXTS = new Set([
  'flac', 'mp3', 'aac', 'wav', 'ogg', 'aiff', 'aif', 'alac', 'm4a',
  'opus', 'wma', 'dsf', 'dff', 'ape', 'mpc',
]);

// Derives a lowercase format key from an item — prefers trackType, falls back to URI extension
const itemFormat = (item) => {
  const tt = item.trackType?.toLowerCase();
  if (tt) return tt;
  const ext = item.uri?.split('?')[0].split('.').pop().toLowerCase();
  return (ext && FORMAT_EXTS.has(ext)) ? ext : null;
};

const BrowseDialog = ({ open, onClose, initialFullscreen = false, initialLargeGrid = false, className: classNameProp }) => {
  "use no memo";
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const [largeGrid, setLargeGrid] = useState(initialLargeGrid);
  const [history, setHistory] = useState([]);
  const [currentNav, setCurrentNav] = useState(null);
  const [albumMenuOpen, setAlbumMenuOpen] = useState(false);
  const [albumMenuPos, setAlbumMenuPos] = useState({ top: 0, left: 0 });
  const [albumAddToPlaylistOpen, setAlbumAddToPlaylistOpen] = useState(false);
  const albumMenuBtnRef = useRef(null);
  const albumMenuRef = useRef(null);
  const browseBodyRef = useRef(null);
  const searchInputRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [focusedGridIndex, setFocusedGridIndex] = useState(-1);
  const pendingFocusIndex = useRef(-1);

  const { data: browseData, isLoading, isError, refetch: refetchBrowse } = useBrowse(currentNav?.uri ?? null);
  const { data: searchData, isLoading: isSearchLoading } = useSearch(debouncedSearch);
  const isSearching = debouncedSearch.length >= 2;
  const { queue } = useVolumioStatus();
  const { socket } = useSocket();

  // Debounce search input — fire API call 400ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Forward alphanumeric keystrokes to the search bar when it isn't focused
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      // Only single printable characters (letters, digits, common punctuation)
      if (e.key.length !== 1) return;
      // Skip if already typing in an input/textarea
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      // Skip modifier combos (Ctrl+C, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      e.preventDefault();
      setSearch((prev) => prev + e.key);
      searchInputRef.current?.focus();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  // Observe dialog-body width for grid column calculation — useLayoutEffect so the
  // measurement is committed before the first paint, preventing a 0-width flash.
  useLayoutEffect(() => {
    const el = browseBodyRef.current;
    if (!el) return;
    const style = window.getComputedStyle(el);
    const contentWidth = el.clientWidth
      - parseFloat(style.paddingLeft || '0')
      - parseFloat(style.paddingRight || '0');
    setContainerWidth(contentWidth || 0);
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const isFavouritesView = currentNav?.uri === 'favourites';
  const isPlaylistsView = currentNav?.uri === 'playlists';

  const queueUris = useMemo(() => new Set((queue ?? []).map((q) => q.uri)), [queue]);

  const browseItems = useMemo(
    () => isSearching
      ? (searchData?.lists?.flatMap((l) => l.items) ?? [])
      : (browseData?.lists?.flatMap((l) => l.items) ?? []),
    [isSearching, searchData, browseData]
  );
  const albumInfo = browseData?.info ?? null;
  const albumArtist = albumInfo?.artist
    || browseItems.find((i) => i.artist)?.artist
    || null;

  const albumPayload = useMemo(() => ({
    uri: currentNav?.uri,
    service: browseItems[0]?.service,
    title: currentNav?.title,
    artist: albumArtist,
    albumart: browseItems.find((i) => i.albumart)?.albumart,
    type: 'folder',
  }), [currentNav, browseItems, albumArtist]);

  useEffect(() => {
    if (!albumMenuOpen) return;
    const handleClickOutside = (e) => {
      if (
        albumMenuRef.current && !albumMenuRef.current.contains(e.target) &&
        albumMenuBtnRef.current && !albumMenuBtnRef.current.contains(e.target)
      ) {
        setAlbumMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [albumMenuOpen]);

  const openAlbumMenu = useCallback((e) => {
    e.stopPropagation();
    const rect = albumMenuBtnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuHeight ? rect.bottom + 4 : rect.top - menuHeight - 4;
    const left = Math.min(rect.right - 180, window.innerWidth - 188);
    setAlbumMenuPos({ top, left });
    setAlbumMenuOpen((v) => !v);
  }, []);

  const closeAlbumMenu = useCallback(() => setAlbumMenuOpen(false), []);
  const albumMenuKbRef = useMenuKeyboard(albumMenuOpen, closeAlbumMenu);

  const handleAlbumPlay = useCallback(() => {
    socket?.emit('replaceAndPlay', albumPayload);
    closeAlbumMenu();
  }, [socket, albumPayload, closeAlbumMenu]);

  const handleAlbumAddToQueue = useCallback(() => {
    socket?.emit('addToQueue', albumPayload);
    closeAlbumMenu();
  }, [socket, albumPayload, closeAlbumMenu]);

  const handleAlbumClearAndPlay = useCallback(() => {
    socket?.emit('clearQueue');
    socket?.emit('replaceAndPlay', albumPayload);
    closeAlbumMenu();
  }, [socket, albumPayload, closeAlbumMenu]);

  const handleAlbumUpdateFolder = useCallback(() => {
    socket?.emit('updateDb', currentNav?.uri);
    closeAlbumMenu();
  }, [socket, currentNav, closeAlbumMenu]);

  const handleAlbumOpenAddToPlaylist = useCallback(() => {
    closeAlbumMenu();
    setAlbumAddToPlaylistOpen(true);
  }, [closeAlbumMenu]);

  const handlePlayAllFavourites = useCallback(() => {
    const items = browseData?.lists?.flatMap((l) => l.items) ?? [];
    if (items.length === 0) return;
    socket?.emit('clearQueue');
    items.forEach((item) => socket?.emit('addToQueue', {
      uri: item.uri,
      service: item.service,
      title: item.title,
      artist: item.artist,
      album: item.album,
      albumart: item.albumart,
      type: item.type,
    }));
    socket?.emit('play', { value: 0 });
  }, [socket, browseData]);

  const navigate = useCallback((uri, title) => {
    setHistory((h) => currentNav ? [...h, currentNav] : h);
    setCurrentNav({ uri, title });
    setSearch('');
    setDebouncedSearch('');
  }, [currentNav]);

  const goBack = useCallback(() => {
    if (history.length === 0) {
      setCurrentNav(null);
    } else {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setCurrentNav(prev);
    }
    setSearch('');
    setDebouncedSearch('');
  }, [history]);

  const goHome = useCallback(() => {
    setHistory([]);
    setCurrentNav(null);
    setSearch('');
    setDebouncedSearch('');
  }, []);

  const filteredItems = browseItems;

  const useVirtual = !isSearching && !isFavouritesView;
  const gridItemMin = largeGrid ? 260 : 130;
  const numCols = viewMode === 'grid'
    ? (containerWidth > 0 ? Math.max(1, Math.floor(containerWidth / gridItemMin)) : 4)
    : 1;
  const virtCount = useVirtual
    ? (viewMode === 'grid' ? Math.ceil(filteredItems.length / numCols) : filteredItems.length)
    : 0;


  const browseVirtualizer = useVirtualizer({
    count: virtCount,
    getScrollElement: () => browseBodyRef.current,
    estimateSize: () => viewMode === 'grid' ? (largeGrid ? 330 : 200) : 56,
    overscan: 10,
    enabled: useVirtual,
  });

  // ── State-based grid keyboard navigation ──
  // When focusedGridIndex changes, scroll the virtualizer to the target row
  // and focus the rendered element after layout.
  useEffect(() => {
    if (focusedGridIndex < 0) return;
    if (useVirtual) {
      const rowIndex = viewMode === 'grid'
        ? Math.floor(focusedGridIndex / numCols)
        : focusedGridIndex;
      browseVirtualizer.scrollToIndex(rowIndex, { align: 'auto' });
    }
    // Store the index so we can focus after the virtualizer renders
    pendingFocusIndex.current = focusedGridIndex;
    // Use rAF to let the virtualizer commit the new rows to the DOM
    const raf = requestAnimationFrame(() => {
      const body = browseBodyRef.current;
      if (!body) return;
      const cards = body.querySelectorAll('.browse-result-card, .browse-result-row');
      // Map flat item index to the rendered card — virtualised rows may skip
      // earlier items, so use data-item-index attributes if available,
      // otherwise fall back to the nth visible card.
      let target = null;
      for (const card of cards) {
        if (card.dataset.itemIndex === String(pendingFocusIndex.current)) {
          target = card;
          break;
        }
      }
      if (target) {
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
      pendingFocusIndex.current = -1;
    });
    return () => cancelAnimationFrame(raf);
  }, [focusedGridIndex, useVirtual, viewMode, numCols, browseVirtualizer]);

  // Keyboard handler for grid/list items — intercepts arrow keys on browse-result cards
  // and navigates by item index. Works for both virtualised and non-virtualised lists.
  useEffect(() => {
    if (!open) return;
    function gridKeyHandler(e) {
      const card = e.target.closest?.('.browse-result-card, .browse-result-row');
      if (!card) return;
      const body = browseBodyRef.current;
      if (!body || !body.contains(card)) return;

      const idx = parseInt(card.dataset.itemIndex, 10);
      if (isNaN(idx)) return;

      let nextIdx = -1;
      const total = filteredItems.length;

      if (viewMode === 'grid') {
        switch (e.key) {
          case 'ArrowRight':
            nextIdx = idx + 1 < total ? idx + 1 : 0;
            break;
          case 'ArrowLeft':
            nextIdx = idx - 1 >= 0 ? idx - 1 : total - 1;
            break;
          case 'ArrowDown':
            nextIdx = idx + numCols < total ? idx + numCols : idx;
            break;
          case 'ArrowUp':
            if (idx - numCols >= 0) {
              nextIdx = idx - numCols;
            } else {
              // First row — move focus up to the search bar
              e.preventDefault();
              e.stopPropagation();
              searchInputRef.current?.focus();
              return;
            }
            break;
          default:
            return;
        }
      } else {
        switch (e.key) {
          case 'ArrowDown':
            nextIdx = idx + 1 < total ? idx + 1 : 0;
            break;
          case 'ArrowUp':
            if (idx > 0) {
              nextIdx = idx - 1;
            } else {
              // First item — move focus up to the search bar
              e.preventDefault();
              e.stopPropagation();
              searchInputRef.current?.focus();
              return;
            }
            break;
          default:
            return;
        }
      }

      if (nextIdx >= 0 && nextIdx !== idx) {
        e.preventDefault();
        e.stopPropagation();
        setFocusedGridIndex(nextIdx);
      }
    }
    document.addEventListener('keydown', gridKeyHandler, true);
    return () => document.removeEventListener('keydown', gridKeyHandler, true);
  }, [open, viewMode, numCols, filteredItems.length]);

  // Reset focused index when navigating to a new folder
  useEffect(() => {
    setFocusedGridIndex(-1);
  }, [currentNav]);

  // Search result sections (each list from the API has a title like "Artists", "Albums", etc.)
  const searchSections = isSearching ? (searchData?.lists ?? []) : null;

  // Album view: all items are songs (no search applied — use raw browse list)
  const rawBrowseItems = browseData?.lists?.flatMap((l) => l.items) ?? [];
  const isAlbumView = !isSearching && !isLoading && !isError && rawBrowseItems.length > 0
    && rawBrowseItems.every((i) => i.type === 'song');

  const albumYear = albumInfo?.year ?? null;

  const trackCount = browseItems.length;
  const totalDuration = browseItems.reduce((sum, i) => sum + (i.duration || 0), 0);

  // Audio format: prefer trackType on items, fall back to URI extension.
  // Collect unique formats and build one chip per format.
  const uniqueFormats = [...new Set(browseItems.map(itemFormat).filter(Boolean))];

  // Best quality sample (first item that has samplerate/bitdepth/bitrate data)
  const qualitySample = browseItems.find((i) => i.samplerate || i.bitdepth || i.bitrate) ?? null;

  const albumFooter = isAlbumView ? (
    <div className="album-footer">
      {albumArtist && (
        <span className="album-footer__chip">
          <span className="material-icons">person</span>
          {albumArtist}
        </span>
      )}
      <span className="album-footer__chip">
        <span className="material-icons">music_note</span>
        {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
      </span>
      {totalDuration > 0 && (
        <span className="album-footer__chip">
          <span className="material-icons">schedule</span>
          {formatTotalDuration(totalDuration)}
        </span>
      )}
      {albumYear && (
        <span className="album-footer__chip">
          <span className="material-icons">calendar_today</span>
          {albumYear}
        </span>
      )}
      {uniqueFormats.map((fmt) => {
        const logoSrc = FORMAT_LOGO_MAP[fmt];
        return (
          <span key={fmt} className="album-footer__chip album-footer__chip--format">
            {logoSrc
              ? <img src={logoSrc} alt={fmt} className="album-footer__format-logo" />
              : <span className="album-footer__format-text">{fmt.toUpperCase()}</span>
            }
          </span>
        );
      })}
      {qualitySample && (
        <span className="album-footer__chip">
          {[qualitySample.samplerate, qualitySample.bitdepth].filter(Boolean).join(' / ')
            || qualitySample.bitrate}
        </span>
      )}
    </div>
  ) : null;

  const headerActions = (
    <button
      type="button"
      className="btn btn-icon dialog-close dialog-close--expand"
      onClick={() => setIsFullscreen((v) => !v)}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
    >
      <span className="material-icons">
        {isFullscreen ? 'filter_none' : 'crop_square'}
      </span>
    </button>
  );

  const toolbar = (
    <div className="browse-toolbar">
      <div className="browse-toolbar__left" onKeyDown={(e) => {
        if (e.key === 'ArrowRight' && e.target.tagName === 'BUTTON') {
          const btns = [...e.currentTarget.querySelectorAll('button:not(:disabled)')];
          if (btns.length && e.target === btns[btns.length - 1]) {
            e.preventDefault(); e.stopPropagation(); searchInputRef.current?.focus();
          }
        }
      }}>
        <Button classNames="btn-icon" label="Home" onClick={goHome} disabled={!currentNav}>
          <span className="material-icons">home</span>
        </Button>
        <Button
          classNames={`btn-icon${!currentNav ? ' disabled' : ''}`}
          label="Back"
          onClick={goBack}
          disabled={!currentNav}
        >
          <span className="material-icons">arrow_back</span>
        </Button>
        <Button
          classNames={`btn-icon${viewMode === 'grid' ? ' active' : ''}`}
          label="Grid view"
          onClick={() => setViewMode('grid')}
          disabled={!currentNav}
        >
          <span className="material-icons">grid_view</span>
        </Button>
        <Button
          classNames={`btn-icon${viewMode === 'list' ? ' active' : ''}`}
          label="List view"
          onClick={() => setViewMode('list')}
          disabled={!currentNav}
        >
          <span className="material-icons">view_list</span>
        </Button>
        {viewMode === 'grid' && (
          <Button
            classNames={`btn-icon${largeGrid ? ' active' : ''}`}
            label={largeGrid ? 'Normal size' : 'Large tiles'}
            onClick={() => setLargeGrid((v) => !v)}
            disabled={!currentNav}
          >
            <span className="material-icons">{largeGrid ? 'zoom_out' : 'zoom_in'}</span>
          </Button>
        )}
      </div>
      <div className="browse-toolbar__right">
        <div className="browse-search">
          <span className="material-icons browse-search__icon">search</span>
          <input
            ref={searchInputRef}
            className="browse-search__input"
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' && !search) {
                const left = e.target.closest('.browse-toolbar')?.querySelector('.browse-toolbar__left');
                const btns = left ? [...left.querySelectorAll('button:not(:disabled)')] : [];
                if (btns.length) { e.preventDefault(); e.stopPropagation(); btns[btns.length - 1].focus(); }
              }
              if (e.key === 'ArrowRight' && !search) {
                const body = e.target.closest('.dialog, .browse-dialog')?.querySelector('.dialog-body');
                const first = body?.querySelector('a, button:not(:disabled), [tabindex="0"]');
                if (first) { e.preventDefault(); e.stopPropagation(); first.focus(); }
              }
            }}
            aria-label="Search"
          />
          {search && (
            <button
              type="button"
              className="browse-search__clear"
              onClick={() => { setSearch(''); setDebouncedSearch(''); }}
              onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); searchInputRef.current?.focus(); } }}
              aria-label="Clear search"
            >
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
        {isAlbumView && (
          <button
            ref={albumMenuBtnRef}
            className="btn-icon"
            type="button"
            aria-label="Album options"
            onClick={openAlbumMenu}
          >
            <span className="material-icons">more_vert</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderHome = () => (
    <div className={viewMode === 'grid' ? 'browse-grid' : 'browse-list'}>
      {BROWSE_TILES.map(({ id, label, icon, uri }) => (
        <Button key={id} label={label} classNames="btn-secondary browse-tile" onClick={() => navigate(uri, label)}>
          <span className="material-icons browse-tile__icon">{icon}</span>
          <span className="browse-tile__label">{label}</span>
        </Button>
      ))}
    </div>
  );

  const renderBrowseResults = () => {
    const loading = isSearching ? isSearchLoading : isLoading;

    if (loading) {
      return (
        <div className="browse-status">
          <span className="material-icons browse-status__icon spin">refresh</span>
          <span>{isSearching ? 'Searching…' : 'Loading…'}</span>
        </div>
      );
    }
    if (!isSearching && isError) {
      return (
        <div className="browse-status browse-status--error">
          <span className="material-icons browse-status__icon">error_outline</span>
          <span>Failed to load. Try again.</span>
        </div>
      );
    }
    if (filteredItems.length === 0) {
      return (
        <div className="browse-status">
          <span className="material-icons browse-status__icon">inbox</span>
          <span>{isSearching ? `No results for "${debouncedSearch}"` : 'No items found.'}</span>
        </div>
      );
    }

    const containerClass = viewMode === 'grid'
      ? `browse-results-grid${largeGrid ? ' browse-results-grid--large' : ''}`
      : 'browse-results-list';

    // When searching, render results grouped by section (Artists, Albums, Songs, etc.)
    if (isSearching && searchSections?.length > 0) {
      // Build a flat index counter across all sections so each item gets a unique itemIndex
      let flatIdx = 0;
      return (
        <div className="browse-search-results">
          {searchSections.map((section, si) => {
            if (!section.items?.length) return null;
            return (
              <div key={section.title ?? si} className="browse-search-section">
                {section.title && (
                  <h6 className="browse-search-section__title">{section.title}</h6>
                )}
                <div className={containerClass}>
                  {section.items.map((item, i) => {
                    const idx = flatIdx++;
                    return (
                      <TrackItem
                        key={item.uri ?? `${si}-${i}`}
                        item={item}
                        viewMode={viewMode}
                        onNavigate={navigate}
                        queueUris={queueUris}
                        itemIndex={idx}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (useVirtual) {
      const virtualItems = browseVirtualizer.getVirtualItems();

      const scrollContent = viewMode === 'grid' ? (
        <div style={{ height: browseVirtualizer.getTotalSize(), position: 'relative' }}>
          {virtualItems.map((virtualRow) => {
            const startIdx = virtualRow.index * numCols;
            const rowItems = filteredItems.slice(startIdx, startIdx + numCols);
            // Pad with nulls so every row has exactly numCols cells — keeps item widths uniform
            const cells = rowItems.length < numCols
              ? [...rowItems, ...Array(numCols - rowItems.length).fill(null)]
              : rowItems;
            return (
              <div
                key={virtualRow.index}
                data-index={virtualRow.index}
                ref={browseVirtualizer.measureElement}
                className={containerClass}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  // Override CSS auto-fill with the computed column count;
                  // minmax(0,1fr) prevents implicit auto-min expansion.
                  gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
                  // Remove CSS class padding — rows are positioned absolutely, gap is handled
                  // by virtualRow.start offsets and paddingBottom on each row.
                  padding: 0,
                  paddingBottom: '1rem',
                }}
              >
                {cells.map((item, colIdx) =>
                  item ? (
                    <TrackItem
                      key={item.uri ?? (startIdx + colIdx)}
                      item={item}
                      viewMode={viewMode}
                      onNavigate={navigate}
                      queueUris={queueUris}
                      onFavouriteToggled={isFavouritesView ? refetchBrowse : undefined}
                      isPlaylistItem={isPlaylistsView}
                      onPlaylistDeleted={isPlaylistsView ? refetchBrowse : undefined}
                      itemIndex={startIdx + colIdx}
                    />
                  ) : (
                    <div key={`empty-${colIdx}`} />
                  )
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ height: browseVirtualizer.getTotalSize(), position: 'relative' }}>
          {virtualItems.map((virtualItem) => {
            const item = filteredItems[virtualItem.index];
            return (
              <div
                key={item.uri ?? virtualItem.index}
                data-index={virtualItem.index}
                ref={browseVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                  textAlign: 'left',
                }}
              >
                <TrackItem
                  item={item}
                  viewMode={viewMode}
                  onNavigate={navigate}
                  queueUris={queueUris}
                  onFavouriteToggled={isFavouritesView ? refetchBrowse : undefined}
                  isPlaylistItem={isPlaylistsView}
                  onPlaylistDeleted={isPlaylistsView ? refetchBrowse : undefined}
                  itemIndex={virtualItem.index}
                />
              </div>
            );
          })}
        </div>
      );

      return (
        <>
          {scrollContent}
        </>
      );
    }

    return (
      <div className={containerClass}>
        {isFavouritesView && (
          <button className="browse-play-all" onClick={handlePlayAllFavourites}>
            <span className="material-icons">playlist_play</span>
            <span>Play All</span>
          </button>
        )}
        {filteredItems.map((item, i) => (
          <TrackItem
            key={item.uri ?? i}
            item={item}
            viewMode={viewMode}
            onNavigate={navigate}
            queueUris={queueUris}
            onFavouriteToggled={isFavouritesView ? refetchBrowse : undefined}
            isPlaylistItem={isPlaylistsView}
            onPlaylistDeleted={isPlaylistsView ? refetchBrowse : undefined}
            itemIndex={i}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title={isSearching ? `Search: ${debouncedSearch}` : currentNav ? currentNav.title : 'Browse'}
        size={isFullscreen ? 'full' : 'lg'}
        className={[isFullscreen ? 'browse-dialog--fullscreen' : null, classNameProp].filter(Boolean).join(' ') || undefined}
        headerActions={headerActions}
        toolbar={toolbar}
        footer={albumFooter}
        bodyRef={browseBodyRef}
      >
        {isSearching || currentNav ? renderBrowseResults() : renderHome()}
      </Dialog>
      {albumMenuOpen && createPortal(
        <div
          ref={(node) => { albumMenuRef.current = node; albumMenuKbRef.current = node; }}
          className="track-menu"
          role="menu"
          style={{ position: 'fixed', top: albumMenuPos.top, left: albumMenuPos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="track-menu__item" onClick={handleAlbumPlay}>
            <span className="material-icons">play_arrow</span>
            Play
          </button>
          <button className="track-menu__item" onClick={handleAlbumAddToQueue}>
            <span className="material-icons">queue_music</span>
            Add to Queue
          </button>
          <button className="track-menu__item" onClick={handleAlbumClearAndPlay}>
            <span className="material-icons">playlist_play</span>
            Clear &amp; Play
          </button>
          <div className="track-menu__separator" />
          <button className="track-menu__item" onClick={handleAlbumOpenAddToPlaylist}>
            <span className="material-icons">playlist_add</span>
            Add to Playlist
          </button>
          <button className="track-menu__item" onClick={handleAlbumUpdateFolder}>
            <span className="material-icons">refresh</span>
            Update Folder
          </button>
        </div>,
        document.body
      )}
      {albumAddToPlaylistOpen && (
        <AddToPlaylistDialog
          open={albumAddToPlaylistOpen}
          onClose={() => setAlbumAddToPlaylistOpen(false)}
          track={albumPayload}
        />
      )}
    </>
  );
};

BrowseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialFullscreen: PropTypes.bool,
  initialLargeGrid: PropTypes.bool,
  className: PropTypes.string,
};

export default BrowseDialog;

