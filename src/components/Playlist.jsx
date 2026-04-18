import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import SlidePanel from './SlidePanel';

const Playlist = ({ open, onClose, queue, currentPosition, isPlaying, onPlay, onRemove, onClear, host, width = 'max(50vw, 380px)' }) => {
  const activeRef = useRef(null);

  // Scroll the current track into view when the panel opens
  useEffect(() => {
    if (open && activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [open, currentPosition]);

  const resolveArt = (art) => {
    if (!art) return '';
    if (art.startsWith('http')) return art;
    return `${host}${art}`;
  };

  const subtitle = queue.length === 0
    ? null
    : currentPosition != null && currentPosition >= 0
      ? `${queue.length} ${queue.length === 1 ? 'track' : 'tracks'} · Playing ${currentPosition + 1} of ${queue.length}`
      : `${queue.length} ${queue.length === 1 ? 'track' : 'tracks'}`;

  const headerActions = queue.length > 0 ? (
    <button
      type="button"
      className="btn-icon text-danger p-1"
      onClick={onClear}
      aria-label="Clear queue"
      title="Clear queue"
    >
      <span className="material-icons">playlist_remove</span>
    </button>
  ) : null;

  return (
    <SlidePanel open={open} onClose={onClose} title="Queue" subtitle={subtitle} width={width ?? '380px'} headerActions={headerActions}>
      {queue.length === 0 ? (
        <div className="d-flex flex-column align-items-center justify-content-center text-white-50 py-5">
          <span className="material-icons mb-2" style={{ fontSize: '2rem', opacity: 0.4 }}>
            queue_music
          </span>
          <span style={{ fontSize: '0.85rem' }}>Queue is empty</span>
        </div>
      ) : (
        <ul className="playlist-list list-unstyled m-0">
          {queue.map((track, index) => {
            const isCurrent = index === currentPosition;
            const artUrl = resolveArt(track.albumart);

            return (
              <li
                key={`${track.uri}-${index}`}
                ref={isCurrent ? activeRef : null}
                className={`playlist-item d-flex align-items-center gap-2 ${isCurrent ? 'playlist-item--active' : ''
                  }`}
                role="button"
                tabIndex={0}
                onClick={() => onPlay(index)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay(index); } }}
              >
                {/* Album art with play overlay */}
                <div className="playlist-art-wrap">
                  {artUrl ? (
                    <img src={artUrl} alt="" className="playlist-art" />
                  ) : (
                    <div className="playlist-art playlist-art--empty">
                      <span className="material-icons" style={{ fontSize: '1rem', opacity: 0.4 }}>
                        music_note
                      </span>
                    </div>
                  )}
                  {isCurrent && isPlaying && (
                    <div className="playlist-art-overlay">
                      <span className="material-icons" style={{ fontSize: '1rem' }}>
                        play_arrow
                      </span>
                    </div>
                  )}
                </div>

                {/* Track info */}
                <div className="flex-grow-1 overflow-hidden">
                  <div className="playlist-track-title text-truncate">
                    {track.name || track.title || 'Unknown'}
                  </div>
                  <div className="playlist-track-meta text-truncate">
                    {track.artist || 'Unknown Artist'}
                    {track.album ? ` — ${track.album}` : ''}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  className="btn-icon text-danger p-1 playlist-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  aria-label="Remove from queue"
                >
                  <span className="material-icons">close</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SlidePanel>
  );
};

Playlist.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  queue: PropTypes.array.isRequired,
  currentPosition: PropTypes.number,
  isPlaying: PropTypes.bool,
  onPlay: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onClear: PropTypes.func,
  host: PropTypes.string,
  width: PropTypes.string,
};

export default Playlist;
