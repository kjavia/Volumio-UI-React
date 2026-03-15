import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import AudioMotionAnalyzer from 'audiomotion-analyzer';

const SpectrumAnalyzer = ({ streamUrl, isPlaying, gradient = 'prism', mode = 2 }) => {
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const analyzerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !audioRef.current) return;

    let analyzer;
    try {
      analyzer = new AudioMotionAnalyzer(containerRef.current, {
        source: audioRef.current,
        connectSpeakers: false, // analyze only, don't play through browser
        gradient,
        mode,
        frequencyScale: 'log',
        showScaleX: false,
        showBgColor: false,
        overlay: true,
        bgAlpha: 0,
        smoothing: 0.8,
        reflexRatio: 0.3,
        reflexAlpha: 0.4,
        reflexFit: true,
        height: containerRef.current.offsetHeight || 120,
        width: containerRef.current.offsetWidth || 800,
      });
      analyzerRef.current = analyzer;
    } catch (e) {
      // Silently fail if Web Audio API is unavailable (e.g. SSR)
      console.warn('SpectrumAnalyzer: failed to initialize', e);
    }

    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.destroy();
        analyzerRef.current = null;
      }
    };
  }, [gradient, mode]);

  // Resume/suspend audio context in sync with playback state to allow
  // autoplay policies to be satisfied on user interaction
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {
        // Autoplay blocked — the context will resume on next user interaction
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Hidden audio element pulling from the Volumio stream */}
      <audio
        ref={audioRef}
        src={streamUrl}
        crossOrigin="anonymous"
        preload="none"
        style={{ display: 'none' }}
      />
    </div>
  );
};

SpectrumAnalyzer.propTypes = {
  streamUrl: PropTypes.string.isRequired,
  isPlaying: PropTypes.bool,
  gradient: PropTypes.string,
  mode: PropTypes.number,
};

export default SpectrumAnalyzer;
