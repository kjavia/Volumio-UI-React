import PropTypes from 'prop-types';
import './cd-cover-player.scss';

const CdCoverPlayer = ({ isPlaying, albumArt }) => {
  const artStyle = albumArt ? { backgroundImage: `url(${albumArt})` } : {};

  return (
    <div className="cd-case-container">
      {/* <!-- The CD Disc (Behind) --> */}
      <div className={`cd-disc-spinning ${isPlaying ? 'playing' : ''}`}>
        <div className="cd-surface-glare-spin"></div>
        <div className="cd-inner-ring-spin"></div>
        <div className="cd-hole-spin"></div>
      </div>

      {/* <!-- The Jewel Case (Front) --> */}
      <div className="cd-jewel-case">
        <div className="case-art" style={artStyle}></div>
        <div className="case-glare"></div>
      </div>
    </div>
  );
};

CdCoverPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
  albumArt: PropTypes.string,
};

export default CdCoverPlayer;
