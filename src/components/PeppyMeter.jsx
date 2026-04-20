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
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      ref={ref}
      className="peppy-meter-placeholder"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: '#444',
        border: '2px dashed #888',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ccc',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        lineHeight: 1.6,
        textAlign: 'center',
        flexShrink: 0,
      }}
    >
      Peppy Meter Placeholder.
      Use this information to set up your Peppy Meter correctly.
      <span>{width} × {height} px</span>
      <span>top: {pos.top}px &nbsp; left: {pos.left}px</span>
    </div>
  );
};

PeppyMeter.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
};

export default PeppyMeter;
