import Button from '@/components/Button';
import SecondaryControlLabel from './SecondaryControlLabel';

const AddToPlaylistButton = ({ onAddToPlaylist, showText }) => (
  <Button classNames="btn-icon" onClick={onAddToPlaylist} label="Add to Playlist" data-shortcut-key="a">
    {showText
      ? <SecondaryControlLabel>ADD</SecondaryControlLabel>
      : <span className="material-icons">playlist_add</span>}
  </Button>
);

export default AddToPlaylistButton;
