import PropTypes from 'prop-types';
import './globe-player.scss';

const GlobePlayer = ({ isPlaying }) => {
  return (
    <div className="globe-player">
      <div className={`globe-wrap ${isPlaying ? 'playing' : 'paused'}`}>
        <div className="globe" />
      </div>
      <div className="globe-halo" />
    </div>
  );
};

GlobePlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
};

export default GlobePlayer;

