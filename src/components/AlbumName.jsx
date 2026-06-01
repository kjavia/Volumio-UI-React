import PropTypes from 'prop-types';
import Marquee from './Marquee';

const AlbumName = ({ album }) => {
    if (!album) return null;
    return (
        <div className="album-name user-select-none small w-100 responsive-album">
            <Marquee>{album}</Marquee>
        </div>
    );
};

AlbumName.propTypes = {
    album: PropTypes.string,
};

export default AlbumName;
