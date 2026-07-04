import './radio-player.scss';

/*
 * Image-based vintage radio. The `.radio-container` keeps the same
 * class name / responsive sizing rules that the layout stylesheets
 * already target, but the visual is a single background PNG plus a
 * `.radio-tuner-needle` element that sweeps left ↔ right across the
 * tuner strip while a track is playing.
 */
const RadioPlayer = ({ isPlaying }) => {
  return (
    <div className="radio-container">
      <div className={`radio-image ${isPlaying ? 'playing' : ''}`}>
        <div className={`radio-tuner-needle ${isPlaying ? 'playing' : ''}`} aria-hidden="true" />
      </div>
    </div>
  );
};


export default RadioPlayer;

