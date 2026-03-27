import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

// Scrolls long text continuously (codepen.io/jamesbarnett/pen/kQebQO style).
// Two copies of the text sit side-by-side; animating -50% loops back to the
// start of copy 2, creating a seamless ticker.
function MarqueeTitle({ text, className }) {
  const outerRef = useRef(null);
  const [scrolling, setScrolling] = useState(false);

  // Reset whenever the text changes
  useEffect(() => { setScrolling(false); }, [text]);

  // Measure only while showing a single static copy (no duplicates yet)
  useEffect(() => {
    if (scrolling) return;
    const el = outerRef.current;
    if (!el) return;
    const check = () => { if (el.scrollWidth > el.clientWidth) setScrolling(true); };
    const id = requestAnimationFrame(check);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { cancelAnimationFrame(id); ro.disconnect(); };
  }, [text, scrolling]);

  // Speed: 1 char ≈ 0.18 s, minimum 6 s
  const dur = `${Math.max(6, (text?.length ?? 0) * 0.18)}s`;

  return (
    <div ref={outerRef} className={`marquee-outer ${className ?? ''}`}>
      {scrolling ? (
        <span className="marquee-content" style={{ animationDuration: dur }}>
          {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
        </span>
      ) : (
        <span>{text}</span>
      )}
    </div>
  );
}
MarqueeTitle.propTypes = { text: PropTypes.string, className: PropTypes.string };
import AddToPlaylistDialog from './AddToPlaylistDialog';
import { useSocket } from '@/contexts/SocketContext';
import useFavourites from '@/hooks/useFavourites';
import { VOLUMIO_BASE_URL } from '@/config';
import { CgPiano } from "react-icons/cg";
import { FaGlobeAmericas, FaCross } from "react-icons/fa";
import { MdChildCare, MdTheaterComedy } from "react-icons/md";
import { BiSolidCameraMovie } from "react-icons/bi";
import { LuPodcast } from "react-icons/lu";
import { TbChristmasTree } from "react-icons/tb";
import { PiDiscoBall } from "react-icons/pi";
import { GiGuitar, GiSaxophone, GiMusicalNotes, GiMicrophone, GiBanjo, GiGrandPiano, GiBeachBall } from "react-icons/gi";
import { PiGuitar } from "react-icons/pi";
import { FaRegGrinStars } from "react-icons/fa";

const PLAYABLE_TYPES = new Set(['song', 'webradio', 'mywebradio', 'cuesong', 'remdisk']);
const ALBUM_TYPES = new Set(['folder', 'album', 'artist', 'genre']);

// Maps genre title keywords to a Material Icon name.
const GENRE_ICON_MAP = [
  [/rock|metal|punk|grunge|hardcore|heavy/i, <GiGuitar />],
  [/jazz/i, <GiSaxophone />],
  [/classical|orchestra|symphony|chamber|opera|baroque/i, <GiMusicalNotes />],
  [/electronic|techno|new age|edm|trance|house|dubstep|drum.?n.?bass|dnb|synthwave|ambient|chill/i, <CgPiano />],
  [/hip.?hop|rap|r&b|rnb|soul|funk/i, <GiMicrophone />],
  [/country|folk|bluegrass|americana/i, <GiBanjo />],
  [/blues/i, <GiGrandPiano />],
  [/reggae|ska/i, <GiBeachBall />],
  [/latin|salsa|bossa|samba|flamenco/i, <PiGuitar />],
  [/world|afro|celtic|indian|asian/i, <FaGlobeAmericas />],
  [/gospel|spiritual|christian|worship/i, <FaCross />],
  [/children|kids|nursery/i, <MdChildCare />],
  [/comedy|humor/i, <MdTheaterComedy />],
  [/soundtrack|film|movie|score|cinema/i, <BiSolidCameraMovie />],
  [/podcast|talk|spoken/i, <LuPodcast />],
  [/christmas|holiday/i, <TbChristmasTree />],
  [/dance/i, <PiDiscoBall />],
  [/pop|chart|hit/i, <FaRegGrinStars />],
];

const genreIcon = (title) => {
  if (!title) return 'category';
  for (const [pattern, icon] of GENRE_ICON_MAP) {
    if (pattern.test(title)) return icon;
  }
  return 'category';
};

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

  const isGenre = item.uri.startsWith('genre');
  const artUrl = isGenre ? null : albumartUrl(item.albumart);

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
            {isGenre
              ? <span className="material-icons browse-result-card__genre-icon">{genreIcon(item.title)}</span>
              : artUrl
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
          {isGenre
            ? <span className="material-icons browse-result-row__genre-icon">{genreIcon(item.title)}</span>
            : artUrl
              ? <img src={artUrl} alt="" loading="lazy" />
              : <span className="material-icons">music_note</span>
          }
        </div>
        <div className="browse-result-row__info">
          <MarqueeTitle text={item.title} className="browse-result-row__title" />
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
