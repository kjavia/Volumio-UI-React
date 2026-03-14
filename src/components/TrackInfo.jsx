import PropTypes from 'prop-types';

const TrackInfo = ({ title, artist, album, isInFooter }) => {
  return (
    <div
      className={`track-info d-flex flex-column ${isInFooter ? 'align-items-start ms-3' : 'align-items-center text-center mb-4'}`}
    >
      <div className={`track-title user-select-none ${isInFooter ? 'h6 text-start mb-0' : ''}`}>
        {title || 'Unknown Title'}
      </div>
      <div className={`artist-name user-select-none ${isInFooter ? 'small text-start' : ''}`}>
        {artist || 'Unknown Artist'}
      </div>
      {!isInFooter && album && (
        <div className="album-name user-select-none mt-1 opacity-75">{album}</div>
      )}
    </div>
  );
};

TrackInfo.propTypes = {
  title: PropTypes.string,
  artist: PropTypes.string,
  album: PropTypes.string,
  isInFooter: PropTypes.bool,
};

export default TrackInfo;
