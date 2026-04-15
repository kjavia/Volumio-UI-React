import PropTypes from 'prop-types';
import { FaSpotify, FaYoutube, FaSoundcloud, FaDeezer } from 'react-icons/fa';
import { SiTidal, SiYoutubemusic, SiApplemusic, SiPandora, SiBandcamp, SiNapster } from 'react-icons/si';

/**
 * Displays a service/source badge for the given Volumio service name.
 *
 * Services with react-icons brand icons use those directly.
 * Services with an SVG in /assets/logos/services/ use an <img>.
 * Everything else falls back to a styled text pill.
 */

// icon: react-icons component (rendered as JSX)
// img:  path under /assets/logos/services/ (drop file there to activate)
// null entry → local/unknown service, render nothing
const SERVICE_MAP = {
  // ── Spotify ──────────────────────────────────────────────────────────────
  spotify: { label: 'Spotify', icon: FaSpotify, color: '#1DB954' },
  spop: { label: 'Spotify', icon: FaSpotify, color: '#1DB954' },
  volspotconnect2: { label: 'Spotify', icon: FaSpotify, color: '#1DB954' },
  volspotconnect: { label: 'Spotify', icon: FaSpotify, color: '#1DB954' },
  // ── Tidal ────────────────────────────────────────────────────────────────
  tidal: { label: 'Tidal', icon: SiTidal, color: '#ffffff' },
  tidalconnect: { label: 'Tidal', icon: SiTidal, color: '#ffffff' },
  tidalsession: { label: 'Tidal', icon: SiTidal, color: '#ffffff' },
  // ── Qobuz ────────────────────────────────────────────────────────────────
  qobuz: { label: 'Qobuz', img: '/assets/logos/services/qobuz.svg' },
  // ── Deezer ───────────────────────────────────────────────────────────────
  deezer: { label: 'Deezer', icon: FaDeezer, color: '#FF0092' },
  // ── SoundCloud ───────────────────────────────────────────────────────────
  soundcloud: { label: 'SoundCloud', icon: FaSoundcloud, color: '#FF5500' },
  // ── YouTube ──────────────────────────────────────────────────────────────
  youtube: { label: 'YouTube', icon: FaYoutube, color: '#FF0000' },
  youtube2: { label: 'YouTube', icon: FaYoutube, color: '#FF0000' },
  ytcr: { label: 'YouTube', icon: FaYoutube, color: '#FF0000' },
  // ── YouTube Music ────────────────────────────────────────────────────────
  youtubemusic: { label: 'YT Music', icon: SiYoutubemusic, color: '#FF0000' },
  // ── Apple Music ──────────────────────────────────────────────────────────
  applemusic: { label: 'Apple Music', icon: SiApplemusic, color: '#FC3C44' },
  'apple music': { label: 'Apple Music', icon: SiApplemusic, color: '#FC3C44' },
  // ── Other services ───────────────────────────────────────────────────────
  pandora: { label: 'Pandora', icon: SiPandora, color: '#3668FF' },
  bandcamp: { label: 'Bandcamp', icon: SiBandcamp, color: '#1DA0C3' },
  napster: { label: 'Napster', icon: SiNapster, color: '#000000' },
  radio: { label: 'Web Radio' },
  webradio: { label: 'Web Radio' },
  mpd: null, // local — don't show a badge
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

  const { label, icon: Icon, img, color } = entry;

  // SVG file logo (e.g. Qobuz — drop file in public/assets/logos/services/)
  // Falls back to text badge if the file hasn't been added yet.
  if (img) {
    return (
      <img
        src={img}
        alt={label}
        className={`service-logo-img ${className}`}
        style={{ height: '1.6rem', width: 'auto', objectFit: 'contain' }}
        onError={(e) => {
          // SVG not present yet — replace with text badge
          const badge = document.createElement('span');
          badge.className = `service-logo-badge ${className}`;
          badge.textContent = label;
          e.target.replaceWith(badge);
        }}
      />
    );
  }

  // react-icons brand icon
  if (Icon) {
    return (
      <Icon
        aria-label={label}
        className={`service-logo-icon ${className}`}
        style={{ fontSize: '1.8rem', color: color || 'currentColor', flexShrink: 0 }}
      />
    );
  }

  // Text pill fallback
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
