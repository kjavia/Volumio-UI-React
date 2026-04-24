import PropTypes from 'prop-types';

// Map trackType values to available logo files in /assets/logos/
const LOGO_MAP = {
  flac: '/assets/logos/flac.svg',
  mp3: '/assets/logos/mp3.svg',
  ogg: '/assets/logos/ogg.svg',
  wav: '/assets/logos/wav.svg',
  aiff: '/assets/logos/aiff.svg',
  dsd: '/assets/logos/dsd.svg',
  dsf: '/assets/logos/dsd.svg',
  dff: '/assets/logos/dsd.svg',
};

// trackType values that are streaming service names, not audio formats
const STREAMING_SERVICES = new Set([
  'spotify', 'spop', 'tidal', 'qobuz', 'deezer', 'soundcloud',
  'youtube', 'youtubemusic', 'applemusic', 'pandora', 'bandcamp',
  'napster', 'webradio', 'radio',
]);

const StreamInfo = ({ trackType, codec, samplerate, bitdepth, bitrate, className }) => {
  // Don't render if we have nothing to show
  if (!trackType && !codec && !samplerate && !bitdepth && !bitrate) {
    return null;
  }

  // Don't treat streaming service names as audio format labels
  const formatType = trackType && !STREAMING_SERVICES.has(trackType.toLowerCase()) ? trackType : null;
  // Use trackType for logo first, fall back to codec from the API
  const logoSrc = (formatType ? LOGO_MAP[formatType.toLowerCase()] : null)
    || (codec ? LOGO_MAP[codec.toLowerCase()] : null);

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
      style={className ? { userSelect: 'none' } : { opacity: 0.6, userSelect: 'none' }}
    >
      {/* Format logo or text fallback */}
      {logoSrc ? (
        <span
          className="format-logo-responsive"
          role="img"
          aria-label={formatType}
          style={{
            display: 'inline-block',
            aspectRatio: '2/1',
            WebkitMaskImage: `url(${logoSrc})`,
            maskImage: `url(${logoSrc})`,
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            backgroundColor: 'currentColor',
            opacity: 0.8,
          }}
        />
      ) : (
        formatType && (
          <span className="text-uppercase fw-semibold" style={{ letterSpacing: '0.05em' }}>
            {formatType}
          </span>
        )
      )}

      {/* Hi-res logo */}
      {isHighRes && (
        <img
          src="/assets/logos/hires.svg"
          alt="Hi-Res"
          className="format-logo-responsive hires-logo"
          style={{ width: 'auto', aspectRatio: '2/1' }}
        />
      )}

      {/* Quality info */}
      {qualityStr && (
        <>
          <span>{qualityStr}</span>
        </>
      )}

      {/* Bitrate — always shown when available */}
      {bitrate && (
        <>
          {(logoSrc || formatType || qualityStr) && <span className="text-white-50">·</span>}
          <span>{bitrate}</span>
        </>
      )}
    </div>
  );
};

StreamInfo.propTypes = {
  trackType: PropTypes.string,
  codec: PropTypes.string,
  samplerate: PropTypes.string,
  bitdepth: PropTypes.string,
  bitrate: PropTypes.string,
  className: PropTypes.string,
};

export default StreamInfo;
