import PropTypes from 'prop-types';
import './vinyl-cover-player.scss';

const VinylCoverPlayer = ({ isPlaying, albumArt }) => {
  return (
    <>
      {/* <!-- Vinyl Record Container --> */}
      <div className="vinyl-sleeve-container">
        {/* <!-- The Record (Behind) --> */}
        <div className={`vinyl-disc ${isPlaying ? 'playing' : ''}`}>
          <div className="vinyl-grooves"></div>
          <div className="vinyl-label">
            {albumArt && <img src={albumArt} alt="" className="vinyl-label-art" />}
          </div>
          <div className="vinyl-shine"></div>
        </div>

        {/* <!-- The Sleeve (Front) --> */}
        <div className="album-sleeve">
          <div className="sleeve-art">
            {albumArt && <img src={albumArt} alt="Album Art" className="sleeve-art-img" />}
          </div>
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
