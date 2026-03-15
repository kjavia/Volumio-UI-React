import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import SlidePanel from './SlidePanel';

const Playlist = ({ open, onClose, queue, currentPosition, isPlaying, onPlay, onRemove, host }) => {
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

  return (
    <SlidePanel open={open} onClose={onClose} title="Queue" width="380px">
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
                className={`playlist-item d-flex align-items-center gap-2 py-2 px-1 ${
                  isCurrent ? 'playlist-item--active' : ''
                }`}
                onClick={() => onPlay(index)}
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
                  className="btn btn-link p-0 playlist-remove"
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
  host: PropTypes.string,
};

export default Playlist;
