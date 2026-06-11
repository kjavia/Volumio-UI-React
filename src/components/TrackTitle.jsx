import PropTypes from 'prop-types';
import Marquee from './Marquee';

const TrackTitle = ({ title, isInFooter, align = 'center' }) => (
    <div
        className={`track-title user-select-none w-100 ${isInFooter ? 'h6 text-start mb-0' : 'responsive-title fw-bold'}`}
        style={{ textAlign: align }}
    >
        <Marquee align={align}>{title || 'Unknown Title'}</Marquee>
    </div>
);

TrackTitle.propTypes = {
    title: PropTypes.string,
    isInFooter: PropTypes.bool,
    align: PropTypes.oneOf(['left', 'center', 'right']),
};

export default TrackTitle;
