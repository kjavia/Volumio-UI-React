import PropTypes from 'prop-types';
import Marquee from './Marquee';

const AlbumName = ({ album, align = 'center' }) => {
    if (!album) return null;
    return (
        <div className="album-name user-select-none small w-100 responsive-album" style={{ textAlign: align }}>
            <Marquee align={align}>{album}</Marquee>
        </div>
    );
};

AlbumName.propTypes = {
    album: PropTypes.string,
    align: PropTypes.oneOf(['left', 'center', 'right']),
};

export default AlbumName;
