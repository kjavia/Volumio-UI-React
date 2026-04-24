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

// DSD format types
const DSD_TYPES = new Set(['dsd', 'dsf', 'dff']);

/**
 * Derive a DSD variant label (DSD64, DSD128, DSD256, DSD512) from the
 * samplerate string that Volumio sends.  Volumio may report the native
 * rate as "2.82 MHz", "5.64 MHz", etc. or as a raw Hz integer.
 */
function getDsdLabel(samplerate) {
  const sr = String(samplerate || '');
  let nativeHz = 0;
  const mhzMatch = sr.match(/^(\d+\.?\d*)\s*[Mm][Hh][Zz]/);
  if (mhzMatch) {
    nativeHz = Math.round(parseFloat(mhzMatch[1]) * 1_000_000);
  } else {
    nativeHz = parseInt(sr, 10) || 0;
  }
  if (nativeHz >= 22_000_000) return 'DSD512';
  if (nativeHz >= 10_000_000) return 'DSD256';
  if (nativeHz >= 5_000_000) return 'DSD128';
  if (nativeHz > 0) return 'DSD64';
  return 'DSD';
}

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

  // Detect DSD formats
  const isDsd = formatType && DSD_TYPES.has(formatType.toLowerCase());

  const samplerateKhz = samplerate ? parseFloat(samplerate) : 0;
  const bitdepthNum = bitdepth ? parseInt(bitdepth, 10) : 0;
  const isHighRes = !isDsd && bitdepthNum >= 24 && samplerateKhz >= 96;

  // Build quality string
  let qualityStr;
  if (isDsd) {
    // DSD: just show the samplerate if available — logo already identifies the format
    qualityStr = samplerate ? String(samplerate) : '';
  } else {
    // PCM: e.g. "44.1 kHz / 16 bit"
    const qualityParts = [];
    if (samplerate) qualityParts.push(String(samplerate));
    if (bitdepth) qualityParts.push(String(bitdepth));
    qualityStr = qualityParts.join(' / ');
  }

  return (
    <div
      className={`stream-info d-flex align-items-center gap-4 responsive-stream-info flex-nowrap${className ? ` ${className}` : ' justify-content-center w-100'}`}
      style={className ? { userSelect: 'none', fontFamily: 'var(--font-display)', lineHeight: 1 } : { opacity: 0.6, userSelect: 'none', fontFamily: 'var(--font-display)', lineHeight: 1 }}
    >
      {/* Format logo or text fallback */}
      {logoSrc ? (
        <span
          className="format-logo-responsive"
          role="img"
          aria-label={formatType}
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
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
