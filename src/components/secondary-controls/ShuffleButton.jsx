import Button from '@/components/Button';
import SecondaryControlLabel from './SecondaryControlLabel';

const ShuffleButton = ({ shuffle, onShuffle, showText }) => (
  <Button
    classNames={`btn-icon ${shuffle ? 'active' : ''}`}
    onClick={onShuffle}
    label={shuffle ? 'Shuffle On' : 'Shuffle Off'}
    data-shortcut-key="s"
  >
    {showText
      ? <SecondaryControlLabel>SHUFFLE</SecondaryControlLabel>
      : <span className="material-icons">shuffle</span>}
  </Button>
);

export default ShuffleButton;
