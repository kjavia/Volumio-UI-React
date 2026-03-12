import PropTypes from 'prop-types';
import './vinyl-cover-player.scss';

const VinylCoverPlayer = ({ isPlaying }) => {
  return (
    <>
      {/* <!-- Vinyl Record Container --> */}
      <div className="vinyl-sleeve-container">
        {/* <!-- The Record (Behind) --> */}
        <div className={`vinyl-disc ${isPlaying ? 'playing' : ''}`}>
          <div className="vinyl-grooves"></div>
          <div className="vinyl-label"></div>
          <div className="vinyl-shine"></div>
        </div>

        {/* <!-- The Sleeve (Front) --> */}
        <div className="album-sleeve">
          <div className="sleeve-art"></div>
        </div>
      </div>
    </>
  );
};

VinylCoverPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
};

export default VinylCoverPlayer;
