import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const PeppyMeter = ({ width = 480, height = 320 }) => {
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const update = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setPos({ top: Math.round(rect.top), left: Math.round(rect.left) });
      }
    };
    setTimeout(update(), 2000);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('width', `${width}px`, 'important');
      ref.current.style.setProperty('height', `${height}px`, 'important');
    }
  }, [width, height]);

  return (
    <div
      ref={ref}
      className="peppy-meter-placeholder"
      style={{
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
        flex: 'none',
        alignSelf: 'center',
      }}
    >
      Peppy Meter Placeholder.
      Use this information to set up your Peppy Meter correctly.
      <span>width: {width} × height: {height} px</span>
      <span>x: {pos.left}px &nbsp; y: {pos.top}px</span>
    </div>
  );
};

PeppyMeter.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
};

export default PeppyMeter;
