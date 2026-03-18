import PropTypes from 'prop-types';
import { useSeek } from '@/contexts/SeekContext';
import './cassette-player.scss';

// Reel sizing: supply reel (left) shrinks, take-up reel (right) grows as tape plays
const MIN_REEL = 20; // % at end
const MAX_REEL = 38; // % at start

const CassettePlayer = ({ isPlaying, albumArt }) => {
  const { seek, duration } = useSeek();
  const progress = duration > 0 ? Math.min(seek / (duration * 1000), 1) : 0;
  const supplySize = MAX_REEL - (MAX_REEL - MIN_REEL) * progress; // L: shrinks
  const takeupSize = MIN_REEL + (MAX_REEL - MIN_REEL) * progress; // R: grows

  const reelLStyle = { width: `${supplySize}%` };
  const reelRStyle = { width: `${takeupSize}%` };
  const spoolLStyle = { width: `${supplySize * 0.47}%` };
  const spoolRStyle = { width: `${takeupSize * 0.47}%` };
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
          <div className="reel-L" style={reelLStyle}></div>
          <div className="reel-R" style={reelRStyle}></div>

          {/* <!-- Spools --> */}
          <div className="spool spool-left" style={spoolLStyle}>
            <div className={`spool-inner ${isPlaying ? 'playing' : ''}`}>
              <div className="spool-teeth"></div>
            </div>
            <div className="spool-hole"></div>
          </div>

          <div className="spool spool-right" style={spoolRStyle}>
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
  albumArt: PropTypes.string,
};

export default CassettePlayer;
