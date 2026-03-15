import PropTypes from 'prop-types';

// Map trackType values to available logo files in /assets/logos/
const LOGO_MAP = {
  flac: '/assets/logos/flac.svg',
  mp3: '/assets/logos/mp3.svg',
  wav: '/assets/logos/wav.svg',
  aiff: '/assets/logos/aiff.svg',
  dsd: '/assets/logos/dsd.svg',
  dsf: '/assets/logos/dsd.svg',
  dff: '/assets/logos/dsd.svg',
};

// Friendly labels for known services
const SERVICE_LABELS = {
  mpd: 'Local',
  spop: 'Spotify',
  webradio: 'Web Radio',
  tidal: 'Tidal',
  qobuz: 'Qobuz',
  youtube: 'YouTube',
  airplay: 'AirPlay',
  upnp: 'UPnP',
  bluetooth: 'Bluetooth',
};

const StreamInfo = ({ trackType, samplerate, bitdepth, bitrate, service }) => {
  // Don't render if we have nothing to show
  if (!trackType && !samplerate && !bitdepth && !bitrate && !service) {
    return null;
  }

  const logoSrc = trackType ? LOGO_MAP[trackType.toLowerCase()] : null;
  const serviceLabel = service ? SERVICE_LABELS[service.toLowerCase()] || service : null;

  // Build quality string: e.g. "44.1 kHz / 16 bit" or "320 kbps"
  const qualityParts = [];
  if (samplerate) qualityParts.push(samplerate);
  if (bitdepth) qualityParts.push(bitdepth);
  const qualityStr = qualityParts.join(' / ');

  return (
    <div
      className="stream-info d-flex align-items-center justify-content-center gap-2 w-100 mt-1"
      style={{ fontSize: '0.75rem', opacity: 0.6, userSelect: 'none' }}
    >
      {/* Format logo or text fallback */}
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={trackType}
          style={{ height: '1rem', width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.8 }}
        />
      ) : (
        trackType && (
          <span className="text-uppercase fw-semibold" style={{ letterSpacing: '0.05em' }}>
            {trackType}
          </span>
        )
      )}

      {/* Quality info */}
      {qualityStr && (
        <>
          {(logoSrc || trackType) && <span className="text-white-50">·</span>}
          <span>{qualityStr}</span>
        </>
      )}

      {/* Bitrate (shown if no samplerate/bitdepth, e.g. for mp3) */}
      {bitrate && !qualityStr && (
        <>
          {(logoSrc || trackType) && <span className="text-white-50">·</span>}
          <span>{bitrate}</span>
        </>
      )}

      {/* Source / service */}
      {serviceLabel && (
        <>
          <span className="text-white-50">·</span>
          <span>{serviceLabel}</span>
        </>
      )}
    </div>
  );
};

StreamInfo.propTypes = {
  trackType: PropTypes.string,
  samplerate: PropTypes.string,
  bitdepth: PropTypes.string,
  bitrate: PropTypes.string,
  service: PropTypes.string,
};

export default StreamInfo;
