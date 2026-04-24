import PropTypes from 'prop-types';
import Marquee from './Marquee';

const TrackInfo = ({ title, artist, album, isInFooter, children }) => {
  return (
    <div
      className={`track-info d-flex flex-column ${isInFooter
        ? 'align-items-start ms-3'
        : 'align-items-center w-100 text-center overflow-hidden cq-track-info'
        }`}
    >
      <div
        className={`track-title user-select-none w-100 ${isInFooter ? 'h6 text-start mb-0' : 'responsive-title fw-bold'
          }`}
      >
        <Marquee>{title || 'Unknown Title'}</Marquee>
      </div>
      <div
        className={`artist-name user-select-none w-100 ${isInFooter ? 'small text-start' : 'responsive-artist'
          }`}
      >
        <Marquee>{artist || 'Unknown Artist'}</Marquee>
      </div>
      {!isInFooter && album && (
        <div className="album-name user-select-none small w-100 responsive-album">
          <Marquee>{album}</Marquee>
        </div>
      )}
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
