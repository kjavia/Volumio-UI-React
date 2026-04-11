import PropTypes from 'prop-types';

/**
 * Displays a service/source badge for the given Volumio service name.
 *
 * If a logo image exists in /assets/logos/services/ it is shown as an <img>.
 * Otherwise a styled text pill is rendered as a fallback — easy to extend
 * later by simply dropping an SVG into the logos/services/ folder.
 */

// Map Volumio service identifiers → display label (and optionally a logo path).
// Add an `img` key when an actual logo file is available.
const SERVICE_MAP = {
    qobuz: { label: 'Qobuz' },
    tidal: { label: 'Tidal' },
    spotify: { label: 'Spotify' },
    deezer: { label: 'Deezer' },
    'apple music': { label: 'Apple Music' },
    applemusic: { label: 'Apple Music' },
    soundcloud: { label: 'SoundCloud' },
    youtube: { label: 'YouTube' },
    youtubemusic: { label: 'YT Music' },
    radio: { label: 'Web Radio' },
    webradio: { label: 'Web Radio' },
    'mpd': null, // local — don't show a badge
};

const normalise = (s = '') => s.toLowerCase().replace(/[_\s-]+/g, '');

const ServiceLogo = ({ service, className = '' }) => {
    if (!service) return null;

    const key = normalise(service);

    // Try exact match first, then partial
    let entry = SERVICE_MAP[key];
    if (entry === undefined) {
        const found = Object.keys(SERVICE_MAP).find((k) => key.includes(k) || k.includes(key));
        entry = found !== undefined ? SERVICE_MAP[found] : undefined;
    }

    // Null entry → local/unknown service, render nothing
    if (entry === null || entry === undefined) return null;

    const { label, img } = entry;

    if (img) {
        return (
            <img
                src={img}
                alt={label}
                className={`service-logo-img ${className}`}
                style={{ height: '1.6rem', width: 'auto', objectFit: 'contain' }}
            />
        );
    }

    return (
        <span className={`service-logo-badge ${className}`}>
            {label}
        </span>
    );
};

ServiceLogo.propTypes = {
    service: PropTypes.string,
    className: PropTypes.string,
};

export default ServiceLogo;
