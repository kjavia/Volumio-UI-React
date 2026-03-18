import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import cobe from 'cobe';
import { GLOBE_CITIES } from './globe-cities';
import './globe-player.scss';

const MARKER_COLOR = [1, 0, 0];

const GlobePlayer = ({ isPlaying }) => {
  const canvasRef = useRef(null);
  const renderRef = useRef(null);
  const phiRef = useRef(0);
  const thetaRef = useRef(0.4);
  const isPlayingRef = useRef(isPlaying);
  const markersRef = useRef(GLOBE_CITIES);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const width = Math.max(1, Math.floor(canvas.clientWidth));
      const height = Math.max(1, Math.floor(canvas.clientHeight));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (renderRef.current && typeof renderRef.current.resize === 'function') {
        renderRef.current.resize();
      }
    };

    renderRef.current = cobe(canvas, {
      devicePixelRatio: dpr,
      width: Math.floor(canvas.clientWidth * dpr),
      height: Math.floor(canvas.clientHeight * dpr),
      phi: phiRef.current,
      theta: thetaRef.current,
      mapSamples: 16000,
      mapBrightness: 6,
      mapBaseBrightness: 0,
      baseColor: [1, 1, 1],
      markerColor: MARKER_COLOR,
      glowColor: [1, 1, 1],
      diffuse: 1.2,
      dark: 1,
      opacity: 0.9,
      offset: [0, 0],
      scale: 1,
      markers: markersRef.current,
      onRender: (state) => {
        if (!isPlayingRef.current) return state;
        state.phi = phiRef.current;
        state.theta = thetaRef.current;
        phiRef.current += 0.005;
        if (phiRef.current > Math.PI * 2) {
          phiRef.current -= Math.PI * 2;
        }
        return state;
      },
    });

    const observer = new ResizeObserver(() => {
      resize();
    });

    observer.observe(canvas);
    resize();

    return () => {
      observer.disconnect();
      if (renderRef.current && typeof renderRef.current.destroy === 'function') {
        renderRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (renderRef.current && typeof renderRef.current.toggle === 'function') {
      renderRef.current.toggle(isPlaying);
    }
  }, [isPlaying]);

  return (
    <div className="globe-player">
      <div className="globe-wrap">
        <canvas ref={canvasRef} className="globe-canvas" />
      </div>
      <div className="globe-halo" />
    </div>
  );
};

GlobePlayer.propTypes = {
  isPlaying: PropTypes.bool.isRequired,
};

export default GlobePlayer;
