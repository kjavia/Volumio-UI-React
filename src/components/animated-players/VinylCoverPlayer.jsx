import PropTypes from 'prop-types';
import './vinyl-cover-player.scss';

const VinylCoverPlayer = ({ isPlaying, albumArt }) => {
  const artStyle = albumArt ? { backgroundImage: `url(${albumArt})` } : {};

  return (
    <>
      {/* <!-- Vinyl Record Container --> */}
      <div className="vinyl-sleeve-container">
        {/* <!-- The Record (Behind) --> */}
        <div className={`vinyl-disc ${isPlaying ? 'playing' : ''}`}>
          <div className="vinyl-grooves"></div>
          <div className="vinyl-label" style={artStyle}></div>
          <div className="vinyl-shine"></div>
        </div>

        {/* <!-- The Sleeve (Front) --> */}
        <div className="album-sleeve">
          <div className="sleeve-art" style={artStyle}></div>
        </div>
      </div>
    </>
  );
};

VinylCoverPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
  albumArt: PropTypes.string,
};

export default VinylCoverPlayer;
