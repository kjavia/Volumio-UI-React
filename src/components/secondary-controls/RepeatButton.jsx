import Button from '@/components/Button';
import SecondaryControlLabel from './SecondaryControlLabel';

const RepeatButton = ({ repeat, onRepeat, showText }) => (
  <Button
    classNames={`btn-icon ${repeat ? 'active' : ''}`}
    onClick={onRepeat}
    label={repeat ? 'Repeat On' : 'Repeat Off'}
    data-shortcut-key="r"
  >
    {showText
      ? <SecondaryControlLabel>REPEAT</SecondaryControlLabel>
      : <span className="material-icons">repeat</span>}
  </Button>
);

export default RepeatButton;
