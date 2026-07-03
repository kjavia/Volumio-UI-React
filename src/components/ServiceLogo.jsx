import { FaSpotify, FaYoutube, FaSoundcloud, FaDeezer } from 'react-icons/fa';
import { SiTidal, SiYoutubemusic, SiApplemusic, SiPandora, SiBandcamp, SiNapster, SiDlna } from 'react-icons/si';

/**
 * Displays a service/source badge for the given Volumio service name.
 *
 * Services with react-icons brand icons use those directly.
 * Services with an SVG in /assets/logos/services/ use an <img>.
 * Everything else falls back to a styled text pill.
 *
 * Props:
 *   service   – Volumio service name (e.g. "spop", "tidal", "qobuz")
 *   noText    – When true, prefer icon-only / no-text SVG variants
 *   className – Extra CSS class(es) forwarded to the wrapper element
 */

// icon: react-icons component (rendered as JSX)
// img:  path under /assets/logos/services/ (with-text variant)
// noTextImg: path to icon-only SVG variant (used when noText prop is true, only for Qobuz)
// null entry → local/unknown service, render nothing
const SERVICE_MAP = {
  // ── Spotify ──────────────────────────────────────────────────────────────
  spotify: { label: 'Spotify', icon: FaSpotify, color: '#1DB954', imgUrl: '/assets/logos/services/spotify-no-text.svg' },
  spop: { label: 'Spotify', icon: FaSpotify, color: '#1DB954', imgUrl: '/assets/logos/services/spotify-no-text.svg' },
  volspotconnect2: { label: 'Spotify', icon: FaSpotify, color: '#1DB954', imgUrl: '/assets/logos/services/spotify-no-text.svg' },
  volspotconnect: { label: 'Spotify', icon: FaSpotify, color: '#1DB954', imgUrl: '/assets/logos/services/spotify-no-text.svg' },
  // ── Tidal ────────────────────────────────────────────────────────────────
  tidal: { label: 'Tidal', icon: SiTidal, color: '#ffffff', imgUrl: '/assets/logos/services/tidal-no-text.svg' },
  tidalconnect: { label: 'Tidal', icon: SiTidal, color: '#ffffff', imgUrl: '/assets/logos/services/tidal-no-text.svg' },
  tidalsession: { label: 'Tidal', icon: SiTidal, color: '#ffffff', imgUrl: '/assets/logos/services/tidal-no-text.svg' },
  // ── Qobuz (no react-icon available — use SVG) ───────────────────────────
  qobuz: { label: 'Qobuz', img: '/assets/logos/services/qobuz.svg', noTextImg: '/assets/logos/services/qobuz-no-text.svg', imgUrl: '/assets/logos/services/qobuz.svg' },
  // ── Deezer ───────────────────────────────────────────────────────────────
  deezer: { label: 'Deezer', icon: FaDeezer, color: '#FF0092', imgUrl: '/assets/logos/services/deezer-no-text.svg' },
  // ── SoundCloud ───────────────────────────────────────────────────────────
  soundcloud: { label: 'SoundCloud', icon: FaSoundcloud, color: '#FF5500' },
  // ── YouTube ──────────────────────────────────────────────────────────────
  youtube: { label: 'YouTube', icon: FaYoutube, color: '#FF0000', imgUrl: '/assets/logos/services/youtube-no-text.svg' },
  youtube2: { label: 'YouTube', icon: FaYoutube, color: '#FF0000', imgUrl: '/assets/logos/services/youtube-no-text.svg' },
  ytcr: { label: 'YouTube', icon: FaYoutube, color: '#FF0000', imgUrl: '/assets/logos/services/youtube-no-text.svg' },
  // ── YouTube Music ────────────────────────────────────────────────────────
  youtubemusic: { label: 'YT Music', icon: SiYoutubemusic, color: '#FF0000', imgUrl: '/assets/logos/services/youtube-no-text.svg' },
  // ── Apple Music ──────────────────────────────────────────────────────────
  applemusic: { label: 'Apple Music', icon: SiApplemusic, color: '#FC3C44' },
  'apple music': { label: 'Apple Music', icon: SiApplemusic, color: '#FC3C44' },
  // ── DLNA / UPnP ─────────────────────────────────────────────────────────
  upnp: { label: 'DLNA', icon: SiDlna, imgUrl: '/assets/logos/services/dlna.svg' },
  dlna: { label: 'DLNA', icon: SiDlna, imgUrl: '/assets/logos/services/dlna.svg' },
  // ── Other services ───────────────────────────────────────────────────────
  pandora: { label: 'Pandora', icon: SiPandora, color: '#3668FF' },
  bandcamp: { label: 'Bandcamp', icon: SiBandcamp, color: '#1DA0C3' },
  napster: { label: 'Napster', icon: SiNapster, color: '#000000' },
  radio: { label: 'Web Radio' },
  webradio: { label: 'Web Radio' },
  // ── AirPlay ──────────────────────────────────────────────────────────────
  airplay: { label: 'AirPlay', materialIcon: 'airplay', color: '#ffffff' },
  shairportsync: { label: 'AirPlay', materialIcon: 'airplay', color: '#ffffff' },
  airplay_emulation: { label: 'AirPlay', materialIcon: 'airplay', color: '#ffffff' },
  mpd: null, // local — don't show a badge
};

const normalise = (s = '') => s.toLowerCase().replace(/[_\s-]+/g, '');

/**
 * Look up a SERVICE_MAP entry for a single hint string (a service name,
 * trackType, or URI fragment). Returns the map entry (which may itself be
 * `null` for known-but-hidden services like plain MPD) or `undefined` when
 * no match is found.
 */
const lookupEntry = (hint) => {
  if (!hint) return undefined;
  const key = normalise(hint);
  if (!key) return undefined;
  if (Object.prototype.hasOwnProperty.call(SERVICE_MAP, key)) return SERVICE_MAP[key];
  const found = Object.keys(SERVICE_MAP).find((k) => key.includes(k) || k.includes(key));
  return found !== undefined ? SERVICE_MAP[found] : undefined;
};

/**
 * Resolve the best SERVICE_MAP entry using `service` first, then falling
 * back to `trackType` and finally to `uri` — because Volumio often reports
 * `service: 'mpd'` for the generic playback engine while the actual source
 * (Spotify, Tidal, Qobuz, …) is only visible in the trackType or URI. If
 * `service` maps to a real logo we always keep it; only when it's absent
 * or resolves to `mpd`/unknown do the other hints get a chance.
 */
const resolveEntry = (service, trackType, uri) => {
  const primary = lookupEntry(service);
  // A truthy entry with a real logo wins outright.
  if (primary) return primary;
  // Otherwise (undefined or explicitly null like `mpd`), try the fallbacks.
  const fromType = lookupEntry(trackType);
  if (fromType) return fromType;
  const fromUri = lookupEntry(uri);
  if (fromUri) return fromUri;
  // No fallback match — return whatever primary was (null for mpd,
  // undefined for unknown) so the caller can decide what to render.
  return primary;
};

const ServiceLogo = ({ service, trackType, uri, noText = false, className = '' }) => {
  const entry = resolveEntry(service, trackType, uri);

  // Null entry → local/unknown service, render nothing
  if (entry === null || entry === undefined) return null;

  const { label, icon: Icon, img, noTextImg, color, materialIcon } = entry;

  // noText mode: prefer no-text SVG, then material icon, then react-icon, then fall through
  if (noText && noTextImg) {
    return (
      <img
        src={noTextImg}
        alt={label}
        className={`service-logo-img ${className}`}
      />
    );
  }

  if (noText && materialIcon) {
    return (
      <span
        className={`material-icons service-logo-icon ${className}`}
        aria-label={label}
        style={{ color: color || 'currentColor' }}
      >
        {materialIcon}
      </span>
    );
  }

  if (noText && Icon) {
    return (
      <Icon
        aria-label={label}
        className={`service-logo-icon ${className}`}
        style={{ color: color || 'currentColor' }}
      />
    );
  }

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

  // Material icon (e.g. AirPlay)
  if (materialIcon) {
    return (
      <span
        className={`material-icons service-logo-icon ${className}`}
        aria-label={label}
        style={{ fontSize: '1.8rem', color: color || 'currentColor', flexShrink: 0 }}
      >
        {materialIcon}
      </span>
    );
  }

  // Text pill fallback
  return (
    <span className={`service-logo-badge ${className}`}>
      {label}
    </span>
  );
};


/** Returns true when ServiceLogo can render something for this service name. */
export const hasServiceLogo = (service, trackType, uri) => {
  return resolveEntry(service, trackType, uri) != null;
};

/** Returns the SVG image URL for a service (for canvas/non-React use), or null. */
export const getServiceLogoUrl = (service, trackType, uri) => {
  const entry = resolveEntry(service, trackType, uri);
  return entry?.imgUrl || null;
};

export default ServiceLogo;
