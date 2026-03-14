import PropTypes from 'prop-types';

const TrackInfo = ({ title, artist, album, isInFooter }) => {
  return (
    <div
      className={`track-info d-flex flex-column ${
        isInFooter
          ? 'align-items-start ms-3'
          : 'align-items-center text-center mb-1 mb-md-3 mb-lg-4 w-100 overflow-hidden'
      }`}
    >
      <div
        className={`track-title user-select-none text-truncate w-100 ${
          isInFooter ? 'h6 text-start mb-0' : 'fs-5 fs-md-3 fs-lg-2 fw-bold mb-1'
        }`}
      >
        {title || 'Unknown Title'}
      </div>
      <div
        className={`artist-name user-select-none text-truncate w-100 ${
          isInFooter ? 'small text-start' : 'fs-6 fs-md-5 text-white-50'
        }`}
      >
        {artist || 'Unknown Artist'}
      </div>
      {!isInFooter && album && (
        <div className="album-name user-select-none mt-1 opacity-75 small text-truncate w-100">
          {album}
        </div>
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
