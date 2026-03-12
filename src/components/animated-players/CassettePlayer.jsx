import PropTypes from 'prop-types';
import './cassette-player.scss';

const CassettePlayer = ({ isPlaying }) => {
  return (
    <div className="cassette-container">
      <div className="cassette-body">
        {/* <!-- Screws --> */}
        <div className="screw screw-tl"></div>
        <div className="screw screw-tr"></div>
        <div className="screw screw-bl"></div>
        <div className="screw screw-br"></div>
        <div className="screw screw-bc"></div>

        {/* <!-- Label Sticker --> */}
        <div className="cassette-label">
          <div className="label-art">
            <span className="label-text">MIXTAPE 94'</span>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '5px',
              left: '10px',
              fontSize: '10px',
              fontFamily: 'sans-serif',
              color: '#555',
            }}
          >
            SIDE A
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '5px',
              right: '10px',
              fontSize: '10px',
              fontFamily: 'sans-serif',
              color: '#555',
            }}
          >
            NR [YES]
          </div>
        </div>

        {/* <!-- Window Area --> */}
        <div className="cassette-window">
          {/* <!-- Tape Reels Shadow/Bulk --> */}
          <div className="reel-L"></div>
          <div className="reel-R"></div>

          {/* <!-- Spools --> */}
          <div className="spool spool-left">
            <div className={`spool-inner ${isPlaying ? 'playing' : ''}`}>
              <div className="spool-teeth"></div>
            </div>
            <div className="spool-hole"></div>
          </div>

          <div className="spool spool-right">
            <div className={`spool-inner ${isPlaying ? 'playing' : ''}`}>
              <div className="spool-teeth"></div>
            </div>
            <div className="spool-hole"></div>
          </div>
        </div>

        {/* <!-- Bottom Head Area --> */}
        <div className="cassette-bottom">
          <div className="head-area"></div>
        </div>
      </div>
    </div>
  );
};

CassettePlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
};

export default CassettePlayer;
