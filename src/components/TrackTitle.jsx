import PropTypes from 'prop-types';
import Marquee from './Marquee';

const TrackTitle = ({ title, isInFooter }) => (
    <div
        className={`track-title user-select-none w-100 ${isInFooter ? 'h6 text-start mb-0' : 'responsive-title fw-bold'}`}
    >
        <Marquee>{title || 'Unknown Title'}</Marquee>
    </div>
);

TrackTitle.propTypes = {
    title: PropTypes.string,
    isInFooter: PropTypes.bool,
};

export default TrackTitle;
