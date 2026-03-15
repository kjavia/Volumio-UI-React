import PropTypes from 'prop-types';
import './radio-player.scss';

const RadioPlayer = ({ isPlaying }) => {
  return (
    <div className="radio-container">
      <div className="radio-body">
        {/* Top Trim */}
        <div className="radio-trim-top"></div>

        {/* Speaker Grille */}
        <div className="radio-speaker">
          <div className="speaker-cloth">
            <div className="speaker-grille"></div>
          </div>
        </div>

        {/* Dial Area */}
        <div className="radio-dial">
          <div className="dial-glass">
            <div className="dial-scale">
              <span className="dial-freq">530</span>
              <span className="dial-freq">700</span>
              <span className="dial-freq">900</span>
              <span className="dial-freq">1200</span>
              <span className="dial-freq">1600</span>
            </div>
            <div className={`dial-needle ${isPlaying ? 'playing' : ''}`}></div>
            <div className={`dial-glow ${isPlaying ? 'playing' : ''}`}></div>
          </div>
          <div className="dial-band-labels">
            <span className="band-label">AM</span>
            <span className="band-label band-active">FM</span>
            <span className="band-label">SW</span>
          </div>
        </div>

        {/* Controls Row */}
        <div className="radio-controls">
          <div className="radio-knob knob-left">
            <div className="knob-cap">
              <div className="knob-indicator"></div>
            </div>
            <span className="knob-label">VOLUME</span>
          </div>

          {/* Power Indicator */}
          <div className="power-indicator-container">
            <div className={`power-light ${isPlaying ? 'playing' : ''}`}></div>
            <span className="power-label">POWER</span>
          </div>

          <div className="radio-knob knob-right">
            <div className="knob-cap">
              <div className="knob-indicator"></div>
            </div>
            <span className="knob-label">TUNING</span>
          </div>
        </div>

        {/* Bottom Vent */}
        <div className="radio-bottom-vent">
          <div className="vent-slot"></div>
          <div className="vent-slot"></div>
          <div className="vent-slot"></div>
        </div>
      </div>
    </div>
  );
};

RadioPlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
};

export default RadioPlayer;

