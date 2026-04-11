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

const StreamInfo = ({ trackType, samplerate, bitdepth, bitrate, className }) => {
  // Don't render if we have nothing to show
  if (!trackType && !samplerate && !bitdepth && !bitrate) {
    return null;
  }

  const logoSrc = trackType ? LOGO_MAP[trackType.toLowerCase()] : null;

  const samplerateKhz = samplerate ? parseFloat(samplerate) : 0;
  const bitdepthNum = bitdepth ? parseInt(bitdepth, 10) : 0;
  const isHighRes = bitdepthNum >= 24 && samplerateKhz >= 96;

  // Build quality string: e.g. "44.1 kHz / 16 bit" or "320 kbps"
  const qualityParts = [];
  if (samplerate) qualityParts.push(samplerate);
  if (bitdepth) qualityParts.push(bitdepth);
  const qualityStr = qualityParts.join(' / ');

  return (
    <div
      className={`stream-info d-flex align-items-center gap-3 responsive-stream-info overflow-hidden${className ? ` ${className}` : ' justify-content-center w-100'}`}
      style={{ opacity: 0.6, userSelect: 'none' }}
    >
      {/* Format logo or text fallback */}
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={trackType}
          className="format-logo-responsive"
          style={{ width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.8 }}
        />
      ) : (
        trackType && (
          <span className="text-uppercase fw-semibold" style={{ letterSpacing: '0.05em' }}>
            {trackType}
          </span>
        )
      )}

      {/* Hi-res logo */}
      {isHighRes && (
        <img
          src="/assets/logos/hires.svg"
          alt="Hi-Res"
          className="format-logo-responsive hires-logo"
          style={{ width: 'auto' }}
        />
      )}

      {/* Quality info */}
      {qualityStr && (
        <>
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
    </div>
  );
};

StreamInfo.propTypes = {
  trackType: PropTypes.string,
  samplerate: PropTypes.string,
  bitdepth: PropTypes.string,
  bitrate: PropTypes.string,
  className: PropTypes.string,
};

export default StreamInfo;
