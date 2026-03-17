import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import cobe from 'cobe';
import './globe-player.scss';

const GlobePlayer = ({ isPlaying }) => {
  const canvasRef = useRef(null);
  const renderRef = useRef(null);
  const phiRef = useRef(0);
  const thetaRef = useRef(0.4);
  const isPlayingRef = useRef(isPlaying);
  const markerColor = [1, 0.85, 0.2];
  const markersRef = useRef([
    { location: [40.7128, -74.006], size: 0.035 }, // NYC
    { location: [34.0522, -118.2437], size: 0.033 }, // LA
    { location: [51.5074, -0.1278], size: 0.034 }, // London
    { location: [35.6895, 139.6917], size: 0.034 }, // Tokyo
    { location: [37.7749, -122.4194], size: 0.032 }, // SF
    { location: [48.8566, 2.3522], size: 0.032 }, // Paris
    { location: [55.7558, 37.6173], size: 0.031 }, // Moscow
    { location: [19.076, 72.8777], size: 0.031 }, // Mumbai
    { location: [28.6139, 77.209], size: 0.031 }, // Delhi
    { location: [31.2304, 121.4737], size: 0.032 }, // Shanghai
    { location: [39.9042, 116.4074], size: 0.032 }, // Beijing
    { location: [23.1291, 113.2644], size: 0.031 }, // Guangzhou
    { location: [1.3521, 103.8198], size: 0.031 }, // Singapore
    { location: [41.0082, 28.9784], size: 0.03 }, // Istanbul
    { location: [33.8688, 151.2093], size: 0.032 }, // Sydney
    { location: [52.52, 13.405], size: 0.031 }, // Berlin
    { location: [41.9028, 12.4964], size: 0.031 }, // Rome
    { location: [34.6937, 135.5023], size: 0.031 }, // Osaka
    { location: [22.3964, 114.1095], size: 0.031 }, // Hong Kong
    { location: [25.2048, 55.2708], size: 0.03 }, // Dubai
    { location: [19.4326, -99.1332], size: 0.03 }, // Mexico City
    { location: [37.5665, 126.978], size: 0.031 }, // Seoul
    { location: [29.7604, -95.3698], size: 0.031 }, // Houston
    { location: [39.7392, -104.9903], size: 0.03 }, // Denver
    { location: [35.6895, 139.692], size: 0.031 }, // Tokyo coverage
    { location: [41.0082, 28.9784], size: 0.03 }, // Istanbul coverage
  ]);

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
      baseColor: [0.12, 0.16, 0.28],
      markerColor,
      glowColor: [0.6, 0.8, 1],
      diffuse: 1.15,
      dark: 0.05,
      opacity: 1,
      offset: [0, 0],
      scale: 1.02,
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
