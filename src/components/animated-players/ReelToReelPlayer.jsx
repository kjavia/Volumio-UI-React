import PropTypes from 'prop-types';
import './reel-to-reel-player.scss';

const ReelToReelPlayer = ({isPlaying}) => {
  return (
    <div className="reel-deck-container">
      <div className="reel-machine-body">
        {/* <!-- Top Half: Reels --> */}
        <div className="reels-area">
          {/* <!-- Left Reel (Supply) --> */}
          <div className="reel-assembly">
            <div className="tape-pack tape-full"></div>
            <div className="metal-reel-spin">
              <div className="reel-cutouts"></div>
            </div>
            <div className="reel-hub-cap"></div>
          </div>

          {/* <!-- Right Reel (Take-up) --> */}
          <div className="reel-assembly">
            <div className="tape-pack tape-empty"></div>
            <div className="metal-reel-spin">
              <div className="reel-cutouts"></div>
            </div>
            <div className="reel-hub-cap"></div>
          </div>
        </div>

        {/* <!-- Bottom Half: Heads & Path --> */}
        <div className="heads-area">
          {/* <!-- Tape Path Line (simplified) --> */}
          <div className="tape-strip"></div>

          {/* <!-- Rollers --> */}
          <div className="tension-roller roller-left"></div>
          <div className="tension-roller roller-right"></div>

          {/* <!-- Head Cover --> */}
          <div className="head-cover"></div>

          {/* <!-- Decor: VU Meters --> */}
          <div className="vu-meter-group">
            <div className="vu-meter">
              <div className="vu-needle" style={{animationDelay: '0s'}}></div>
            </div>
            <div className="vu-meter">
              <div className="vu-needle" style={{animationDelay: '0.1s'}}></div>
            </div>
          </div>

          {/* <!-- Decor: Knob --> */}
          <div className="deck-knob"></div>
        </div>
      </div>
    </div>
  );
};

ReelToReelPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
};

export default ReelToReelPlayer;
