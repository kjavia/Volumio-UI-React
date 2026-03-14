import PropTypes from 'prop-types';
import './cd-player.scss';

const CdPlayer = ({ isPlaying, albumArt }) => {
  const artStyle = albumArt
    ? {
        backgroundImage: `url(${albumArt})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        zIndex: 1,
      }
    : {};

  return (
    <div className="cd-container">
      <div className={`cd-disc ${isPlaying ? 'playing' : ''}`}>
        <div className="cd-surface"></div>
        <div className="cd-inner-ring"></div>
        <div className="cd-hole"></div>
        <div className="cd-art-img" style={artStyle}></div>
      </div>
    </div>
  );
};

CdPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
  albumArt: PropTypes.string,
};

export default CdPlayer;
