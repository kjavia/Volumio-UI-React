import PropTypes from 'prop-types';
import './album-art.scss';

const AlbumArtPlayer = ({ isPlaying, albumArt }) => {
  return (
    <div className="album-art-player">
      <div className={`rainbow-border ${isPlaying ? 'playing' : ''}`}>
        <div className="album-art-inner">
          {albumArt ? (
            <img src={albumArt} alt="Album Art" className="album-art-image" />
          ) : (
            <div className="album-art-placeholder">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="48"
                height="48"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AlbumArtPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
  albumArt: PropTypes.string,
};

export default AlbumArtPlayer;
