import { useState } from 'react';
import PropTypes from 'prop-types';
import Dialog from './Dialog';
import Button from './Button';
import usePlaylists from '@/hooks/usePlaylists';
import useFavourites from '@/hooks/useFavourites';
import { useSocket } from '@/contexts/SocketContext';

const AddToPlaylistDialog = ({ open, onClose, track }) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addingToFavorites, setAddingToFavorites] = useState(false);

  const { playlists, isLoading, createPlaylist, addToPlaylist, isAdding, isCreating } =
    usePlaylists();
  const { favouritesUris, refetchFavourites } = useFavourites();
  const { socket } = useSocket();

  const isInFavourites = track?.uri && favouritesUris.has(track.uri);

  const handleAddToFavorites = async () => {
    if (!track || !track.uri) {
      setError('No track selected');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setAddingToFavorites(true);

      if (isInFavourites) {
        socket.emit('removeFromFavourites', { uri: track.uri, service: track.service });
        setSuccess('Removed from Favourites');
      } else {
        socket.emit('addToFavourites', {
          uri: track.uri,
          title: track.title,
          artist: track.artist,
          album: track.album,
          albumart: track.albumart,
          service: track.service,
        });
        setSuccess('Added to Favourites');
      }

      setTimeout(() => {
        refetchFavourites();
        setAddingToFavorites(false);
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError('Failed to update favourites');
      setAddingToFavorites(false);
      console.error('Add to favourites error:', err);
    }
  };

  const handleAddToPlaylist = async (playlistName) => {
    if (!track || !track.uri) {
      setError('No track selected');
      return;
    }

    try {
      setError('');
      setSuccess('');
      await addToPlaylist({
        playlistName,
        uri: track.uri,
        service: track.service,
      });
      setSuccess(`Added to "${playlistName}"`);
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError('Failed to add track to playlist');
      console.error('Add to playlist error:', err);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) {
      setError('Please enter a playlist name');
      return;
    }

    try {
      setError('');
      setSuccess('');
      await createPlaylist(newPlaylistName.trim());
      await handleAddToPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreatingNew(false);
    } catch (err) {
      setError('Failed to create playlist');
      console.error('Create playlist error:', err);
    }
  };

  const handleClose = () => {
    setNewPlaylistName('');
    setIsCreatingNew(false);
    setError('');
    setSuccess('');
    setAddingToFavorites(false);
    onClose();
  };

  const footer = (
    <>
      <Button onClick={handleClose} label="Cancel" classNames="btn-secondary" />
      {isCreatingNew && (
        <Button
          onClick={handleCreateAndAdd}
          label={isCreating || isAdding ? 'Adding...' : 'Create & Add'}
          classNames="btn-primary"
        />
      )}
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Add to Playlist"
      size="md"
      footer={footer}
      closeOnBackdrop={!isAdding && !isCreating}
    >
      {isLoading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="dialog-alert error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="dialog-alert success" role="alert">
              {success}
            </div>
          )}

          {!isCreatingNew ? (
            <>
              {/* Track info */}
              {track && (
                <div className="dialog-track-info">
                  <p className="dialog-track-title">{track.title || 'Unknown Track'}</p>
                  <p className="dialog-track-meta">
                    {track.artist || 'Unknown Artist'}
                    {track.album && ` • ${track.album}`}
                  </p>
                </div>
              )}

              {/* Favorites - Always shown first */}
              <div className="mb-3">
                <h6 className="dialog-section-title">QUICK ACTIONS</h6>
                <button
                  type="button"
                  className={`dialog-list-item ${isInFavourites ? 'active' : ''}`}
                  onClick={handleAddToFavorites}
                  disabled={addingToFavorites}
                >
                  <span className="material-icons">
                    {isInFavourites ? 'favorite' : 'favorite_border'}
                  </span>
                  <span>
                    {addingToFavorites
                      ? 'Updating...'
                      : isInFavourites
                        ? 'Remove from Favourites'
                        : 'Add to Favourites'}
                  </span>
                </button>
              </div>

              {/* Existing playlists */}
              {playlists.length > 0 ? (
                <div className="mb-3">
                  <h6 className="dialog-section-title">SELECT PLAYLIST</h6>
                  <div>
                    {playlists.map((playlist) => (
                      <button
                        key={playlist.uri}
                        type="button"
                        className="dialog-list-item"
                        onClick={() => handleAddToPlaylist(playlist.name)}
                        disabled={isAdding}
                      >
                        <span className="material-icons">
                          queue_music
                        </span>
                        <span>{playlist.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ opacity: 0.6, marginBottom: '1rem' }}>No playlists found.</p>
              )}

              {/* Create new button */}
              <Button
                onClick={() => setIsCreatingNew(true)}
                label="Create New Playlist"
                classNames="btn-primary w-100"
              >
                <span className="material-icons me-2">add</span>
                Create New Playlist
              </Button>
            </>
          ) : (
            <>
              {/* Create new playlist form */}
              <div className="mb-3">
                <label htmlFor="playlistName" className="dialog-label">
                  NEW PLAYLIST NAME
                </label>
                <input
                  type="text"
                  className="dialog-input"
                  id="playlistName"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My Playlist"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateAndAdd();
                    }
                  }}
                />
              </div>
              <Button
                onClick={() => setIsCreatingNew(false)}
                label="Back to Playlists"
                classNames="btn-secondary w-100"
              >
                <span className="material-icons me-2">arrow_back</span>
                Back to Playlists
              </Button>
            </>
          )}
        </>
      )}
    </Dialog>
  );
};

AddToPlaylistDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  track: PropTypes.shape({
    title: PropTypes.string,
    artist: PropTypes.string,
    album: PropTypes.string,
    albumart: PropTypes.string,
    uri: PropTypes.string,
    service: PropTypes.string,
  }),
};

export default AddToPlaylistDialog;
