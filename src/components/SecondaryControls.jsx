import Button from './Button';

const Label = ({ children }) => (
    <span className="secondary-btn-label">{children}</span>
);

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
            <Button
                classNames={`btn-icon ${shuffle ? 'active' : ''}`}
                onClick={onShuffle}
                label={shuffle ? 'Shuffle On' : 'Shuffle Off'}
                data-shortcut-key="s"
            >
                {showText
                    ? <Label>SHUFFLE</Label>
                    : <span className="material-icons">shuffle</span>}
            </Button>

            <Button
                classNames={`btn-icon ${repeat ? 'active' : ''}`}
                onClick={onRepeat}
                label={repeat ? 'Repeat On' : 'Repeat Off'}
                data-shortcut-key="r"
            >
                {showText
                    ? <Label>REPEAT</Label>
                    : <span className="material-icons">repeat</span>}
            </Button>

            <Button classNames="btn-icon" onClick={onAddToPlaylist} label="Add to Playlist" data-shortcut-key="a">
                {showText
                    ? <Label>ADD</Label>
                    : <span className="material-icons">playlist_add</span>}
            </Button>

            <Button
                classNames={`btn-icon ${isFavourite ? 'active' : ''}`}
                onClick={onToggleFavourite}
                label={isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                data-shortcut-key="f"
            >
                {showText
                    ? <Label>FAVE</Label>
                    : <span className="material-icons">{isFavourite ? 'favorite' : 'favorite_border'}</span>}
            </Button>

            <Button classNames="btn-icon btn-text" onClick={onShowPlaylist} label="Show Playlist" data-shortcut-key="q">
                {showText
                    ? <Label>QUEUE</Label>
                    : <span className="material-icons">queue_music</span>}
            </Button>

            <Button classNames="btn-icon btn-text" onClick={onBrowse} label="Browse" data-shortcut-key="b">
                {showText
                    ? <Label>BROWSE</Label>
                    : <span className="material-icons">library_music</span>}
            </Button>
        </div>
    );
};


export default SecondaryControls;
