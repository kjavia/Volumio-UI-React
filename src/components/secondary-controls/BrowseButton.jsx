import Button from '@/components/Button';
import SecondaryControlLabel from './SecondaryControlLabel';

const BrowseButton = ({ onBrowse, showText }) => (
  <Button classNames="btn-icon btn-text" onClick={onBrowse} label="Browse" data-shortcut-key="b">
    {showText
      ? <SecondaryControlLabel>BROWSE</SecondaryControlLabel>
      : <span className="material-icons">library_music</span>}
  </Button>
);

export default BrowseButton;
