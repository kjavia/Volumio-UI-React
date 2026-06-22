import Marquee from './Marquee';

const TrackTitle = ({ title, isInFooter, align = 'center' }) => (
    <div
        className={`track-title user-select-none w-100 ${isInFooter ? 'h6 text-start mb-0' : 'responsive-title fw-bold'}`}
        style={{ textAlign: align }}
    >
        <Marquee align={align}>{title || 'Unknown Title'}</Marquee>
    </div>
);


export default TrackTitle;
