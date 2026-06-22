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


export default TrackInfo;
