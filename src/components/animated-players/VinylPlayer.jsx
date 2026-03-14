import PropTypes from 'prop-types';
import './vinyl-player.scss';

const VinylPlayer = ({ isPlaying, albumArt }) => {
  const labelStyle = albumArt
    ? {
        backgroundImage: `url(${albumArt})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {};

  return (
    <>
      {/* <!-- Vinyl Record Container --> */}
      <div className="vinyl-container">
        <div className={`vinyl-record ${isPlaying ? 'playing' : ''}`}>
          <div className="vinyl-grooves"></div>
          <div className="vinyl-label">
            <div className="album-art-img" style={labelStyle}></div>
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
