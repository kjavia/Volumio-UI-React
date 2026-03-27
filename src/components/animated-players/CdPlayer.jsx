import PropTypes from 'prop-types';
import './cd-player.scss';

const CdPlayer = ({ isPlaying, albumArt }) => {
  return (
    <div className="cd-container">
      <div className={`cd-disc ${isPlaying ? 'playing' : ''}`}>
        <div className="cd-surface"></div>
        <div className="cd-inner-ring"></div>
        <div className="cd-hole"></div>
        {albumArt && <img src={albumArt} alt="" className="cd-art-img" />}
      </div>
    </div>
  );
};

CdPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
  albumArt: PropTypes.string,
};

export default CdPlayer;
