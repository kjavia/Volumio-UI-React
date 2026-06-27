import ShuffleButton from './secondary-controls/ShuffleButton';
import RepeatButton from './secondary-controls/RepeatButton';
import AddToPlaylistButton from './secondary-controls/AddToPlaylistButton';
import FavouriteButton from './secondary-controls/FavouriteButton';
import QueueButton from './secondary-controls/QueueButton';
import BrowseButton from './secondary-controls/BrowseButton';

const SecondaryControls = ({
  shuffle,
  repeat,
  onShuffle,
  onRepeat,
  onAddToPlaylist,
  onShowPlaylist,
  onBrowse,
  isFavourite,
  onToggleFavourite,
  textMode,
}) => {
  const showText = textMode;

  return (
    <div className="d-flex gap-3 gap-md-4 align-items-center justify-content-center flex-wrap">
      <ShuffleButton
        shuffle={shuffle}
        onShuffle={onShuffle}
        showText={showText}
      />

      <RepeatButton
        repeat={repeat}
        onRepeat={onRepeat}
        showText={showText}
      />

      <AddToPlaylistButton
        onAddToPlaylist={onAddToPlaylist}
        showText={showText}
      />

      <FavouriteButton
        isFavourite={isFavourite}
        onToggleFavourite={onToggleFavourite}
        showText={showText}
      />

      <QueueButton
        onShowPlaylist={onShowPlaylist}
        showText={showText}
      />

      <BrowseButton
        onBrowse={onBrowse}
        showText={showText}
      />
    </div>
  );
};


export default SecondaryControls;
