import PropTypes from 'prop-types';
import './vinyl-player.scss';

const VinylPlayer = ({ isPlaying, albumArt }) => {
  return (
    <>
      {/* <!-- Vinyl Record Container --> */}
      <div className="vinyl-container">
        <div className={`vinyl-record ${isPlaying ? 'playing' : ''}`}>
          <div className="vinyl-grooves"></div>
          <div className="vinyl-label">
            {albumArt
              ? <img src={albumArt} alt="" className="album-art-img" />
              : <div className="album-art-placeholder"></div>
            }
          </div>
          <div className="vinyl-shine"></div>
        </div>
      </div>
    </>
  );
};

VinylPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
  albumArt: PropTypes.string,
};

export default VinylPlayer;
