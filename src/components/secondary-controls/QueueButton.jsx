import Button from '@/components/Button';
import SecondaryControlLabel from './SecondaryControlLabel';

const QueueButton = ({ onShowPlaylist, showText }) => (
  <Button classNames="btn-icon btn-text" onClick={onShowPlaylist} label="Show Playlist" data-shortcut-key="q">
    {showText
      ? <SecondaryControlLabel>QUEUE</SecondaryControlLabel>
      : <span className="material-icons">queue_music</span>}
  </Button>
);

export default QueueButton;
