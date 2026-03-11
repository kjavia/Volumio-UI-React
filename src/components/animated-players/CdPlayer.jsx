import PropTypes from 'prop-types';
import './cd-player.scss';

const CdPlayer = ({isPlaying}) => {
  return (
    <div className="cd-container">
      <div className="cd-disc">
        <div className="cd-surface"></div>
        <div className="cd-inner-ring"></div>
        <div className="cd-hole"></div>
        <div className="cd-art-img"></div>
      </div>
    </div>
  );
};

CdPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
};

export default CdPlayer;
