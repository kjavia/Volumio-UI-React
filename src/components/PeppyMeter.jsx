import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const PeppyMeter = ({ width = 480, height = 320, containerRef }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const prevConfig = useRef({ width, height });

  useEffect(() => {
    if (prevConfig.current.width !== width || prevConfig.current.height !== height) {
      window.location.reload();
    }
  }, [width, height]);

  useEffect(() => {
    const el = containerRef?.current;
    if (el) {
      el.style.setProperty('width', `${width}px`, 'important');
      el.style.setProperty('height', `${height}px`, 'important');
      el.style.setProperty('min-width', `${width}px`, 'important');
      el.style.setProperty('min-height', `${height}px`, 'important');
      el.style.setProperty('overflow', 'hidden', 'important');
      el.style.setProperty('flex', `0 0 ${width}px`, 'important');
      el.style.setProperty('align-self', 'flex-end', 'important');
      el.style.setProperty('justify-self', 'end', 'important');
    }
  }, [width, height, containerRef]);

  useEffect(() => {
    const el = containerRef?.current;
    const update = () => {
      if (el) {
        const rect = el.getBoundingClientRect();
        setPos({ top: Math.round(rect.top), left: Math.round(rect.left) });
      }
    };
    setTimeout(update, 2000);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [containerRef]);

  return (
    <div
      className="peppy-meter-placeholder"
      style={{
        width: '100%',
        height: '100%',
        background: '#444',
        border: '2px dashed #888',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ccc',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        lineHeight: 1.6,
        textAlign: 'center',
        textWrap: 'wrap',
      }}
    >
      <p>Peppy Meter Placeholder.</p>
      <p>Use this information to set up your Peppy Meter correctly.</p>
      <h5>
        <p>width: {width} × height: {height} px</p>
        <p>x: {pos.left}px &nbsp; y: {pos.top}px</p>
      </h5>
    </div>
  );
};

PeppyMeter.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  containerRef: PropTypes.object,
};

export default PeppyMeter;
