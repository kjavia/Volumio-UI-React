import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import AddToPlaylistDialog from './AddToPlaylistDialog';
import { useSocket } from '@/contexts/SocketContext';
import useFavourites from '@/hooks/useFavourites';
import { VOLUMIO_BASE_URL } from '@/config';

const PLAYABLE_TYPES = new Set(['song', 'webradio', 'mywebradio', 'cuesong', 'remdisk']);
const ALBUM_TYPES = new Set(['folder', 'album', 'artist', 'genre']);

const albumartUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${VOLUMIO_BASE_URL}${url}`;
};

/**
 * Reusable track/browse item component with a contextual action menu.
 *
 * Supports both grid (card) and list (row) layouts.
 * Folder-type items render without the action menu and trigger onNavigate on click.
 * Playable items trigger play on click and expose menu actions.
 *
 * @param {object}  item         - Browse item from Volumio API
 * @param {'grid'|'list'} viewMode
 * @param {function} onNavigate  - Called with (uri, title) for folder items
 * @param {Set}     queueUris    - Optional set of URIs currently in the queue,
 *                                 used to disable "Add to Queue" when already queued
 */
const TrackItem = ({ item, viewMode = 'list', onNavigate, queueUris, onFavouriteToggled, isPlaylistItem = false, onPlaylistDeleted }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [addToPlaylistOpen, setAddToPlaylistOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const { socket } = useSocket();
  const { favouritesUris, addFavouriteOptimistic, removeFavouriteOptimistic } = useFavourites();

  const isPlayable = PLAYABLE_TYPES.has(item.type);
  const isAlbumItem = ALBUM_TYPES.has(item.type);
  const showMenu = isPlayable || isPlaylistItem || isAlbumItem;
  const isFavourite = item.uri ? favouritesUris.has(item.uri) : false;
  const isInQueue = queueUris ? queueUris.has(item.uri) : false;

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    const handleScroll = () => setMenuOpen(false);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuOpen]);

  const openMenu = useCallback((e) => {
    e.stopPropagation();
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Position below the button, aligned to the right edge; flip up if near bottom
    const menuHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuHeight
      ? rect.bottom + 4
      : rect.top - menuHeight - 4;
    const left = Math.min(rect.right - 180, window.innerWidth - 188);
    setMenuPos({ top, left });
    setMenuOpen((v) => !v);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const trackPayload = {
    uri: item.uri,
    service: item.service,
    title: item.title,
    artist: item.artist,
    album: item.album,
    albumart: item.albumart,
    type: item.type,
  };

  const handlePlay = useCallback((e) => {
    e.stopPropagation();
    socket?.emit('replaceAndPlay', trackPayload);
    closeMenu();
  }, [socket, trackPayload, closeMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddToQueue = useCallback((e) => {
    e.stopPropagation();
    if (!isInQueue) socket?.emit('addToQueue', trackPayload);
    closeMenu();
  }, [socket, trackPayload, isInQueue, closeMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClearAndPlay = useCallback((e) => {
    e.stopPropagation();
    socket?.emit('clearQueue');
    socket?.emit('replaceAndPlay', trackPayload);
    closeMenu();
  }, [socket, trackPayload, closeMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleFavourite = useCallback((e) => {
    e.stopPropagation();
    if (isFavourite) {
      removeFavouriteOptimistic(item.uri);
      socket?.emit('removeFromFavourites', { uri: item.uri, service: item.service });
    } else {
      addFavouriteOptimistic(item.uri);
      socket?.emit('addToFavourites', trackPayload);
    }
    onFavouriteToggled?.();
    closeMenu();
  }, [socket, item.uri, item.service, trackPayload, isFavourite, addFavouriteOptimistic, removeFavouriteOptimistic, onFavouriteToggled, closeMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenAddToPlaylist = useCallback((e) => {
    e.stopPropagation();
    closeMenu();
    setAddToPlaylistOpen(true);
  }, [closeMenu]);

  const handlePlayPlaylist = useCallback((e) => {
    e.stopPropagation();
    socket?.emit('replaceAndPlay', trackPayload);
    closeMenu();
  }, [socket, trackPayload, closeMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddPlaylistToQueue = useCallback((e) => {
    e.stopPropagation();
    socket?.emit('addPlaylistToQueue', { name: item.title });
    closeMenu();
  }, [socket, item.title, closeMenu]);

  const handleClearAndPlayPlaylist = useCallback((e) => {
    e.stopPropagation();
    socket?.emit('clearQueue');
    socket?.emit('replaceAndPlay', trackPayload);
    closeMenu();
  }, [socket, trackPayload, closeMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeletePlaylist = useCallback((e) => {
    e.stopPropagation();
    socket?.emit('deletePlaylist', { name: item.title });
    closeMenu();
    onPlaylistDeleted?.();
  }, [socket, item.title, closeMenu, onPlaylistDeleted]);

  const handleUpdateFolder = useCallback((e) => {
    e.stopPropagation();
    socket?.emit('updateDb', item.uri);
    closeMenu();
  }, [socket, item.uri, closeMenu]);

  const handleItemClick = useCallback(() => {
    if (isPlayable) {
      socket?.emit('replaceAndPlay', trackPayload);
    } else {
      onNavigate?.(item.uri, item.title);
    }
  }, [isPlayable, socket, trackPayload, onNavigate, item.uri, item.title]); // eslint-disable-line react-hooks/exhaustive-deps

  const artUrl = albumartUrl(item.albumart);

  const menuPortal = menuOpen && !isPlaylistItem && !isAlbumItem && createPortal(
    <div
      ref={menuRef}
      className="track-menu"
      style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="track-menu__item" onClick={handlePlay}>
        <span className="material-icons">play_arrow</span>
        Play
      </button>
      <button
        className="track-menu__item"
        onClick={handleAddToQueue}
        disabled={isInQueue}
      >
        <span className="material-icons">queue_music</span>
        {isInQueue ? 'Already in Queue' : 'Add to Queue'}
      </button>
      <button className="track-menu__item" onClick={handleClearAndPlay}>
        <span className="material-icons">playlist_play</span>
        Clear &amp; Play
      </button>
      <div className="track-menu__separator" />
      <button className="track-menu__item" onClick={handleOpenAddToPlaylist}>
        <span className="material-icons">playlist_add</span>
        Add to Playlist
      </button>
      <button className="track-menu__item" onClick={handleToggleFavourite}>
        <span className="material-icons">
          {isFavourite ? 'favorite' : 'favorite_border'}
        </span>
        {isFavourite ? 'Remove Favourite' : 'Add Favourite'}
      </button>
    </div>,
    document.body
  );

  const playlistMenuPortal = menuOpen && isPlaylistItem && createPortal(
    <div
      ref={menuRef}
      className="track-menu"
      style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="track-menu__item" onClick={handlePlayPlaylist}>
        <span className="material-icons">play_arrow</span>
        Play
      </button>
      <button className="track-menu__item" onClick={handleAddPlaylistToQueue}>
        <span className="material-icons">queue_music</span>
        Add Playlist to Queue
      </button>
      <button className="track-menu__item" onClick={handleClearAndPlayPlaylist}>
        <span className="material-icons">playlist_play</span>
        Clear &amp; Play
      </button>
      <div className="track-menu__separator" />
      <button className="track-menu__item track-menu__item--danger" onClick={handleDeletePlaylist}>
        <span className="material-icons">delete</span>
        Delete Playlist
      </button>
    </div>,
    document.body
  );

  const albumMenuPortal = menuOpen && isAlbumItem && createPortal(
    <div
      ref={menuRef}
      className="track-menu"
      style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="track-menu__item" onClick={handlePlay}>
        <span className="material-icons">play_arrow</span>
        Play
      </button>
      <button className="track-menu__item" onClick={handleAddToQueue}>
        <span className="material-icons">queue_music</span>
        Add to Queue
      </button>
      <button className="track-menu__item" onClick={handleClearAndPlay}>
        <span className="material-icons">playlist_play</span>
        Clear &amp; Play
      </button>
      <div className="track-menu__separator" />
      <button className="track-menu__item" onClick={handleOpenAddToPlaylist}>
        <span className="material-icons">playlist_add</span>
        Add to Playlist
      </button>
      <button className="track-menu__item" onClick={handleUpdateFolder}>
        <span className="material-icons">refresh</span>
        Update Folder
      </button>
    </div>,
    document.body
  );

  const menuBtn = (
    <button
      ref={btnRef}
      className="track-menu-btn"
      type="button"
      aria-label="Track options"
      onClick={openMenu}
    >
      <span className="material-icons">more_vert</span>
    </button>
  );

  // ── Grid card view ────────────────────────────────────────────────────────
  if (viewMode === 'grid') {
    return (
      <>
        <div className="browse-result-card" onClick={handleItemClick} role="button" tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleItemClick()}
        >
          <div className="browse-result-card__art">
            {artUrl
              ? <img src={artUrl} alt="" loading="lazy" />
              : <span className="material-icons">music_note</span>
            }
            <button
              className="browse-result-card__play"
              type="button"
              aria-label="Play"
              onClick={(e) => { e.stopPropagation(); socket?.emit('replaceAndPlay', trackPayload); }}
            >
              <span className="material-icons">play_arrow</span>
            </button>
          </div>
          {showMenu && (
            <div
              className="browse-result-card__menu"
              onClick={(e) => e.stopPropagation()}
            >
              {menuBtn}
            </div>
          )}
          <div className="browse-result-card__info">
            <span className="browse-result-card__title">{item.title}</span>
            <span className="browse-result-card__sub">{item.artist || '\u00a0'}</span>
          </div>
        </div>
        {menuPortal}
        {playlistMenuPortal}
        {albumMenuPortal}
        {addToPlaylistOpen && (
          <AddToPlaylistDialog
            open={addToPlaylistOpen}
            onClose={() => setAddToPlaylistOpen(false)}
            track={item}
          />
        )}
      </>
    );
  }

  // ── List row view ─────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="browse-result-row"
        onClick={handleItemClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleItemClick()}
      >
        <div className="browse-result-row__art">
          {artUrl
            ? <img src={artUrl} alt="" loading="lazy" />
            : <span className="material-icons">music_note</span>
          }
        </div>
        <div className="browse-result-row__info">
          <span className="browse-result-row__title">{item.title}</span>
          {(item.artist || item.album) && (
            <span className="browse-result-row__sub">
              {[item.artist, item.album].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
        {showMenu ? (
          <div onClick={(e) => e.stopPropagation()}>
            {menuBtn}
          </div>
        ) : (
          <span className="material-icons browse-result-row__chevron">chevron_right</span>
        )}
      </div>
      {menuPortal}
      {playlistMenuPortal}
      {albumMenuPortal}
      {addToPlaylistOpen && (
        <AddToPlaylistDialog
          open={addToPlaylistOpen}
          onClose={() => setAddToPlaylistOpen(false)}
          track={item}
        />
      )}
    </>
  );
};

TrackItem.propTypes = {
  item: PropTypes.shape({
    uri: PropTypes.string,
    title: PropTypes.string,
    artist: PropTypes.string,
    album: PropTypes.string,
    albumart: PropTypes.string,
    service: PropTypes.string,
    type: PropTypes.string,
  }).isRequired,
  viewMode: PropTypes.oneOf(['grid', 'list']),
  onNavigate: PropTypes.func,
  queueUris: PropTypes.instanceOf(Set),
  onFavouriteToggled: PropTypes.func,
  isPlaylistItem: PropTypes.bool,
  onPlaylistDeleted: PropTypes.func,
};

export default TrackItem;
