import PropTypes from 'prop-types';
import Marquee from './Marquee';

const ArtistName = ({ artist, isInFooter }) => (
    <div
        className={`artist-name user-select-none w-100 ${isInFooter ? 'small text-start' : 'responsive-artist'}`}
    >
        <Marquee>{artist || 'Unknown Artist'}</Marquee>
    </div>
);

ArtistName.propTypes = {
    artist: PropTypes.string,
    isInFooter: PropTypes.bool,
};

export default ArtistName;
