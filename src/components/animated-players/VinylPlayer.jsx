import PropTypes from 'prop-types';
import './vinyl-player.scss';

const VinylPlayer = ({isPlaying}) => {
  return (
    <>
      {/* <!-- Vinyl Record Container --> */}
      <div className="vinyl-container">
        <div className="vinyl-record">
          <div className="vinyl-grooves"></div>
          <div className="vinyl-label">
            <div className="album-art-img"></div>
          </div>
          <div className="vinyl-shine"></div>
        </div>
      </div>
    </>
  );
};

VinylPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
};

export default VinylPlayer;
