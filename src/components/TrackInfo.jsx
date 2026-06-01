import PropTypes from 'prop-types';
import TrackTitle from './TrackTitle';
import ArtistName from './ArtistName';
import AlbumName from './AlbumName';

const TrackInfo = ({ title, artist, album, isInFooter, children }) => {
  return (
    <div
      className={`track-info d-flex flex-column ${isInFooter
        ? 'align-items-start ms-3'
        : 'align-items-center w-100 text-center overflow-hidden cq-track-info'
        }`}
    >
      <TrackTitle title={title} isInFooter={isInFooter} />
      <ArtistName artist={artist} isInFooter={isInFooter} />
      {!isInFooter && <AlbumName album={album} />}
      {children}
    </div>
  );
};

TrackInfo.propTypes = {
  title: PropTypes.string,
  artist: PropTypes.string,
  album: PropTypes.string,
  isInFooter: PropTypes.bool,
  children: PropTypes.node,
};

export default TrackInfo;
