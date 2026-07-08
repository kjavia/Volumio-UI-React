import { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { createPortal } from 'react-dom';
import Dialog from './Dialog';
import Button from './Button';
import TrackItem from './TrackItem';
import AddToPlaylistDialog from './AddToPlaylistDialog';
import AlphabetScroller from './AlphabetScroller';
import ServiceLogo, { hasServiceLogo } from './ServiceLogo';
import useBrowse from '@/hooks/useBrowse';
import useSearch from '@/hooks/useSearch';
import useVolumioStatus from '@/hooks/useVolumioStatus';
import { useSocket } from '@/contexts/SocketContext';
import useMenuKeyboard from '@/hooks/useMenuKeyboard';
import axios from 'axios';
import { VOLUMIO_BASE_URL } from '@/config';

const BROWSE_TILES = [
  { id: 'favourites', label: 'Favorites', icon: 'favorite', uri: 'favourites' },
  { id: 'playlists', label: 'Playlists', icon: 'queue_music', uri: 'playlists' },
  { id: 'music-library', label: 'Music Library', icon: 'library_music', uri: 'music-library' },
  { id: 'artists', label: 'Artists', icon: 'person', uri: 'artists://' },
  { id: 'albums', label: 'Albums', icon: 'album', uri: 'albums://' },
  { id: 'genres', label: 'Genres', icon: 'category', uri: 'genres://' },
  { id: 'last-100', label: 'Last 100', icon: 'history', uri: 'Last_100' },
  { id: 'web-radio', label: 'Web Radio', icon: 'radio', uri: 'radio' },
  { id: 'upnp', label: 'Media Servers', service: 'upnp', uri: 'upnp' },
];

// URIs already covered by the hardcoded tiles (normalised to lowercase)
const STATIC_URIS = new Set(BROWSE_TILES.map((t) => t.uri.toLowerCase().replace(/:?\/\/$/, '')));

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
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const albumMenuBtnRef = useRef(null);
  const albumMenuRef = useRef(null);
  const browseBodyRef = useRef(null);
  const searchInputRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window === 'undefined' ? 1920 : window.innerWidth
  );
  const [focusedGridIndex, setFocusedGridIndex] = useState(-1);
  const pendingFocusIndex = useRef(-1);

  const { data: browseData, isLoading, isError, refetch: refetchBrowse } = useBrowse(currentNav?.uri ?? null);
  const { data: searchData, isLoading: isSearchLoading } = useSearch(debouncedSearch);
  const isSearching = debouncedSearch.length >= 2;
  const { queue } = useVolumioStatus();
  const { socket } = useSocket();

  // Fetch root browse sources to discover installed music services (Spotify, Qobuz, etc.)
  const { data: rootSources } = useQuery({
    queryKey: ['browse-sources'],
    queryFn: async () => {
      const { data } = await axios.get(`${VOLUMIO_BASE_URL}/api/v1/browse`);
      return data?.navigation?.lists ?? [];
    },
    staleTime: 60_000,
    retry: 1,
  });

  // Dynamic tiles: sources from Volumio not already in BROWSE_TILES
  const dynamicTiles = useMemo(() => {
    if (!rootSources?.length) return [];
    return rootSources
      .filter((s) => s.uri && !STATIC_URIS.has(s.uri.toLowerCase().replace(/:?\/\/$/, '')))
      .map((s) => ({
        id: s.uri,
        label: s.name,
        uri: s.uri,
        albumart: s.albumart,
        icon: s.icon,
      }));
  }, [rootSources]);

  // Debounce search input — fire API call 400ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

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

  // Track viewport width so the virtualised grid's tile size scales with the
  // SCREEN, not the dialog's inner width (matches the CSS `clamp(_, vw, _)`
  // used for the visible tile min-size).
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

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
    onClose?.();
  }, [socket, albumPayload, closeAlbumMenu, onClose]);

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

  const isSortableList = !isSearching && browseItems.length > 1 && !browseItems.every((i) => i.type === 'song');
  // Sort controls (browse-sort-group) are only shown when the dialog
  // is displaying the "Albums" section (matched by nav title).
  const isAlbumListView = !isSearching && (currentNav?.title || '').trim().toLowerCase() === 'albums';

  const toggleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'year' ? 'desc' : 'asc');
    }
  }, [sortBy]);

  const filteredItems = useMemo(() => {
    if (!isSortableList || !sortBy) return browseItems;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...browseItems].sort((a, b) => {
      if (sortBy === 'name') {
        return dir * (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
      }
      if (sortBy === 'artist') {
        return dir * (a.artist || '').localeCompare(b.artist || '', undefined, { sensitivity: 'base' });
      }
      if (sortBy === 'year') {
        const ya = parseInt(a.year, 10) || 0;
        const yb = parseInt(b.year, 10) || 0;
        return dir * (ya - yb);
      }
      return 0;
    });
  }, [browseItems, isSortableList, sortBy, sortDir]);

  const useVirtual = !isSearching && !isFavouritesView;
  // Tile size scales with the viewport width (not the dialog's inner width),
  // clamped to a sensible range. Matches the CSS `.browse-results-grid`
  // clamp() so JS-computed `numCols` lines up with what CSS renders.
  //   normal:  clamp(100px, 3.5vw, 130px)  → 130px at 4K
  //   large:   clamp(200px, 7vw,   260px)  → 2× the normal size
  const gridItemMin = largeGrid
    ? Math.min(Math.max(200, viewportWidth * 0.07), 260)
    : Math.min(Math.max(100, viewportWidth * 0.035), 130);
  // Column count mirrors CSS `repeat(auto-fill, X)` with a `gap: 1rem`
  // (16px): fits `floor((W + gap) / (X + gap))` tiles. Ignoring the gap
  // (as before) undercounted columns, so on wide dialogs there was
  // visible empty space on the right of every row.
  const GRID_GAP = 16;
  // Estimate the browse-body content width before the ResizeObserver has
  // measured the real value on first mount. Without this estimate,
  // `containerWidth` starts at 0 and `numCols` falls back to 4 for the
  // first render — the tiles only take ~50 % of the row until the next
  // render finishes. Dialog is `dialog-lg` (max 800px) or `dialog-full`
  // (100vw − 2rem), minus ~2rem body padding and 34px scroller reserve.
  const estimatedContainerWidth = isFullscreen
    ? Math.max(200, viewportWidth - 66)
    : Math.max(200, Math.min(viewportWidth - 32, 800) - 34);
  const effectiveContainerWidth = containerWidth > 0
    ? containerWidth
    : estimatedContainerWidth;
  const numCols = viewMode === 'grid'
    ? Math.max(1, Math.floor((effectiveContainerWidth + GRID_GAP) / (gridItemMin + GRID_GAP)))
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

  // ── Alphabet quick-scroll ──
  // Show only for virtualised lists with enough items to benefit
  const showAlphabetScroller = useVirtual && filteredItems.length > 30;

  // Compute scroller labels and index map
  // When sorting by year, show decades (50s, 60s, 70s…); otherwise A-Z letters
  const { scrollerLabels, availableLetters, letterToIndex } = useMemo(() => {
    if (!showAlphabetScroller) return { scrollerLabels: null, availableLetters: [], letterToIndex: {} };

    if (sortBy === 'year') {
      // Build decade labels from items — use full decade for correct ordering
      const decadeMap = new Map(); // fullDecade (e.g. 1970) → 2-digit label (e.g. "70")
      const firstIndex = {};
      for (let i = 0; i < filteredItems.length; i++) {
        const yr = parseInt(filteredItems[i].year, 10);
        if (!yr) continue;
        const fullDecade = Math.floor(yr / 10) * 10;
        const label = `${fullDecade % 100}`.padStart(2, '0');
        decadeMap.set(fullDecade, label);
        if (firstIndex[label] === undefined) firstIndex[label] = i;
      }
      // Sort by full decade value to handle century boundaries correctly
      const sorted = [...decadeMap.entries()]
        .sort((a, b) => sortDir === 'asc' ? a[0] - b[0] : b[0] - a[0])
        .map(([, label]) => label);
      return { scrollerLabels: sorted, availableLetters: sorted, letterToIndex: firstIndex };
    }

    // Default: alphabet letters based on title or artist
    const letters = new Set();
    const firstIndex = {};
    for (let i = 0; i < filteredItems.length; i++) {
      const field = sortBy === 'artist' ? (filteredItems[i].artist || '') : (filteredItems[i].title || '');
      const firstChar = field.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
      letters.add(letter);
      if (firstIndex[letter] === undefined) firstIndex[letter] = i;
    }
    return { scrollerLabels: null, availableLetters: [...letters], letterToIndex: firstIndex };
  }, [showAlphabetScroller, filteredItems, sortBy, sortDir]);

  const handleAlphabetSelect = useCallback((letter) => {
    const itemIndex = letterToIndex[letter];
    if (itemIndex === undefined) return;
    const rowIndex = viewMode === 'grid'
      ? Math.floor(itemIndex / numCols)
      : itemIndex;
    browseVirtualizer.scrollToIndex(rowIndex, { align: 'start' });
    // Also focus the first tile matching this letter so it becomes the
    // selected item (arrow-nav / Enter target). The existing
    // focusedGridIndex effect handles scrolling + focus after the
    // virtualizer renders the row.
    setFocusedGridIndex(itemIndex);
  }, [letterToIndex, viewMode, numCols, browseVirtualizer]);

  // Forward alphanumeric keystrokes to the search bar when it isn't focused.
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

  // Look up which letter corresponds to a given item, using the same
  // scheme as the alphabet scroller (decades for year sort, otherwise
  // the first title/artist letter).
  const letterForItem = useCallback((item) => {
    if (!item) return null;
    if (sortBy === 'year') {
      const yr = parseInt(item.year, 10);
      if (!yr) return null;
      return `${Math.floor(yr / 10) * 10 % 100}`.padStart(2, '0');
    }
    const field = sortBy === 'artist' ? (item.artist || '') : (item.title || '');
    const firstChar = field.charAt(0).toUpperCase();
    return /[A-Z]/.test(firstChar) ? firstChar : '#';
  }, [sortBy]);

  // Derive the current letter from the first visible item in the viewport
  const [currentScrollLetter, setCurrentScrollLetter] = useState(null);

  useEffect(() => {
    const el = browseBodyRef.current;
    if (!el || !showAlphabetScroller) {
      setCurrentScrollLetter(null);
      return;
    }

    const rowHeight = viewMode === 'grid' ? (largeGrid ? 330 : 200) : 56;

    const getLetterFromScroll = () => {
      // Prefer measuring the actual rendered tile art elements. A row is
      // considered "visible" only once its artwork (top part of the tile)
      // has cleared the toolbar / top edge — the moment the art scrolls
      // above the viewport top we advance to the next row's letter.
      const viewportTop = el.getBoundingClientRect().top;
      const rows = el.querySelectorAll('[data-index]');
      for (const row of rows) {
        const art = row.querySelector('.browse-result-card__art, .browse-result-row__art');
        const rect = (art || row).getBoundingClientRect();
        // Small tolerance so subpixel scroll doesn't jitter.
        if (rect.top >= viewportTop - 2) {
          const rowIndex = parseInt(row.getAttribute('data-index'), 10);
          if (Number.isNaN(rowIndex)) continue;
          const itemIndex = viewMode === 'grid' ? rowIndex * numCols : rowIndex;
          return letterForItem(filteredItems[Math.min(itemIndex, filteredItems.length - 1)]);
        }
      }
      // Fallback: nothing measured yet — approximate from scrollTop.
      const scrollTop = el.scrollTop;
      const firstRowIndex = Math.max(0, Math.round(scrollTop / rowHeight));
      const itemIndex = viewMode === 'grid' ? firstRowIndex * numCols : firstRowIndex;
      return letterForItem(filteredItems[Math.min(itemIndex, filteredItems.length - 1)]);
    };

    let rafId = null;
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setCurrentScrollLetter(getLetterFromScroll());
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    // Set initial value
    setCurrentScrollLetter(getLetterFromScroll());

    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [showAlphabetScroller, filteredItems, viewMode, numCols, sortBy, largeGrid, letterForItem]);

  // When the user scrolls (trackpad, wheel, drag) and the currently
  // focused tile leaves the viewport, clear the focus so the highlight
  // doesn't linger on an off-screen card.
  useEffect(() => {
    const el = browseBodyRef.current;
    if (!el || focusedGridIndex < 0) return;
    let rafId = null;
    const checkVisibility = () => {
      rafId = null;
      const card = el.querySelector(`.browse-result-card[data-item-index="${focusedGridIndex}"], .browse-result-row[data-item-index="${focusedGridIndex}"]`);
      if (!card) {
        setFocusedGridIndex(-1);
        return;
      }
      const bodyRect = el.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      // Consider the card off-screen once it's fully above or below the viewport.
      if (cardRect.bottom <= bodyRect.top || cardRect.top >= bodyRect.bottom) {
        setFocusedGridIndex(-1);
      }
    };
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(checkVisibility);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [focusedGridIndex]);

  // When the user is arrow-navigating between tiles, the highlighted
  // letter should match the focused tile (not just the first visible
  // tile). Fall back to the scroll-derived letter otherwise.
  const currentLetter = useMemo(() => {
    if (focusedGridIndex >= 0 && filteredItems[focusedGridIndex]) {
      return letterForItem(filteredItems[focusedGridIndex]);
    }
    return currentScrollLetter;
  }, [focusedGridIndex, filteredItems, letterForItem, currentScrollLetter]);

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
      <Button
        classNames="btn-round btn-primary album-footer__play"
        label="Play album"
        onClick={handleAlbumPlay}
      >
        <span className="material-icons">play_arrow</span>
      </Button>
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
        {currentNav && (
          <Button classNames="btn-icon" label="Home" onClick={goHome}>
            <span className="material-icons">home</span>
          </Button>
        )}
        {currentNav && (
          <Button classNames="btn-icon" label="Back" onClick={goBack}>
            <span className="material-icons">arrow_back</span>
          </Button>
        )}
        {currentNav && (
          <Button
            classNames={`btn-icon${viewMode === 'grid' ? ' active' : ''}`}
            label="Grid view"
            onClick={() => setViewMode('grid')}
          >
            <span className="material-icons">grid_view</span>
          </Button>
        )}
        {currentNav && (
          <Button
            classNames={`btn-icon${viewMode === 'list' ? ' active' : ''}`}
            label="List view"
            onClick={() => setViewMode('list')}
          >
            <span className="material-icons">view_list</span>
          </Button>
        )}
        {currentNav && viewMode === 'grid' && (
          <Button
            classNames={`btn-icon${largeGrid ? ' active' : ''}`}
            label={largeGrid ? 'Normal size' : 'Large tiles'}
            onClick={() => setLargeGrid((v) => !v)}
          >
            <span className="material-icons">{largeGrid ? 'zoom_out' : 'zoom_in'}</span>
          </Button>
        )}
        {currentNav && isSortableList && isAlbumListView && (
          <div className="browse-sort-group">
            <Button
              classNames={`btn-icon btn-sort${sortBy === 'name' ? ' active' : ''}`}
              label="Sort by name"
              onClick={() => toggleSort('name')}
            >
              <span className="material-icons">sort_by_alpha</span>
              {sortBy === 'name' && <span className="material-icons browse-sort-arrow">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
            </Button>
            <Button
              classNames={`btn-icon btn-sort${sortBy === 'artist' ? ' active' : ''}`}
              label="Sort by artist"
              onClick={() => toggleSort('artist')}
            >
              <span className="material-icons">person</span>
              {sortBy === 'artist' && <span className="material-icons browse-sort-arrow">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
            </Button>
            <Button
              classNames={`btn-icon btn-sort${sortBy === 'year' ? ' active' : ''}`}
              label="Sort by year"
              onClick={() => toggleSort('year')}
            >
              <span className="material-icons">calendar_today</span>
              {sortBy === 'year' && <span className="material-icons browse-sort-arrow">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>}
            </Button>
          </div>
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
      {BROWSE_TILES.map(({ id, label, icon, service, uri }) => (
        <Button key={id} label={label} classNames="btn-secondary browse-tile" onClick={() => navigate(uri, label)}>
          {service
            ? <ServiceLogo service={service} noText className="browse-tile__art" />
            : <span className="material-icons browse-tile__icon">{icon}</span>
          }
          <span className="browse-tile__label">{label}</span>
        </Button>
      ))}
      {dynamicTiles.map(({ id, label, uri, albumart }) => {
        const serviceName = label.toLowerCase();
        const uriName = uri.replace(/:?\/\/$/, '').toLowerCase();
        const serviceKey = serviceName || uriName;
        const fallbackImg = albumart ? `${VOLUMIO_BASE_URL}${albumart}` : null;
        return (
          <Button key={id} label={label} classNames="btn-secondary browse-tile" onClick={() => navigate(uri, label)}>
            {hasServiceLogo(serviceKey)
              ? <ServiceLogo service={serviceKey} noText className="browse-tile__art" />
              : fallbackImg
                ? <img src={fallbackImg} alt="" className="browse-tile__art" />
                : <span className="material-icons browse-tile__icon">extension</span>}
            <span className="browse-tile__label">{label}</span>
          </Button>
        );
      })}
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
                        onPlayAndClose={onClose}
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
                  // Fixed-size columns matching the CSS `clamp()` on
                  // `.browse-results-grid` — using `1fr` here would let
                  // each tile stretch when the dialog is maximized, which
                  // defeats the viewport-based sizing. `justify-content:
                  // start` leaves any leftover row space as trailing gap.
                  gridTemplateColumns: `repeat(${numCols}, ${gridItemMin}px)`,
                  justifyContent: 'start',
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
                      onPlayAndClose={onClose}
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
                  onPlayAndClose={onClose}
                  itemIndex={virtualItem.index}
                />
              </div>
            );
          })}
        </div>
      );

      return (
        <div className="browse-body">
          <div className="browse-body__scroll" ref={browseBodyRef}>
            {scrollContent}
          </div>
          {showAlphabetScroller && (
            <AlphabetScroller
              labels={scrollerLabels || undefined}
              availableLetters={availableLetters}
              currentLetter={currentLetter}
              onSelect={handleAlphabetSelect}
            />
          )}
        </div>
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
            onPlayAndClose={onClose}
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
        className={[isFullscreen ? 'browse-dialog--fullscreen' : null, 'browse-dialog', classNameProp].filter(Boolean).join(' ') || undefined}
        headerActions={headerActions}
        toolbar={toolbar}
        footer={albumFooter}
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


export default BrowseDialog;

