import Marquee from './Marquee';

const AlbumName = ({ album, align = 'center' }) => {
    if (!album) return null;
    return (
        <div className="album-name user-select-none w-100 responsive-album" style={{ textAlign: align }}>
            <Marquee align={align}>{album}</Marquee>
        </div>
    );
};


export default AlbumName;
