import PropTypes from 'prop-types';
import './cd-cover-player.scss';

const CdCoverPlayer = ({isPlaying}) => {
  return (
    <div className="cd-case-container">
      {/* <!-- The CD Disc (Behind) --> */}
      <div className="cd-disc-spinning">
        <div className="cd-surface-glare-spin"></div>
        <div className="cd-inner-ring-spin"></div>
        <div className="cd-hole-spin"></div>
      </div>

      {/* <!-- The Jewel Case (Front) --> */}
      <div className="cd-jewel-case">
        <div className="case-art"></div>
        <div className="case-glare"></div>
      </div>
    </div>
  );
};

CdCoverPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
};

export default CdCoverPlayer;
