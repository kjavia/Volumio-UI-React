import PropTypes from 'prop-types';
import Marquee from './Marquee';

const ArtistName = ({ artist, isInFooter, align = 'center' }) => (
    <div
        className={`artist-name user-select-none w-100 ${isInFooter ? 'small text-start' : 'responsive-artist'}`}
        style={{ textAlign: align }}
    >
        <Marquee align={align}>{artist || 'Unknown Artist'}</Marquee>
    </div>
);

ArtistName.propTypes = {
    artist: PropTypes.string,
    isInFooter: PropTypes.bool,
    align: PropTypes.oneOf(['left', 'center', 'right']),
};

export default ArtistName;
