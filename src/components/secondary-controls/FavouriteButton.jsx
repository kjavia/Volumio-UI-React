import Button from '@/components/Button';
import SecondaryControlLabel from './SecondaryControlLabel';

const FavouriteButton = ({ isFavourite, onToggleFavourite, showText }) => (
  <Button
    classNames={`btn-icon ${isFavourite ? 'active' : ''}`}
    onClick={onToggleFavourite}
    label={isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
    data-shortcut-key="f"
  >
    {showText
      ? <SecondaryControlLabel>FAVE</SecondaryControlLabel>
      : <span className="material-icons">{isFavourite ? 'favorite' : 'favorite_border'}</span>}
  </Button>
);

export default FavouriteButton;
