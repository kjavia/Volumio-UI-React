import React from 'react';
import { FaVolumeUp } from 'react-icons/fa';

const VolumeManager = ({ isOnFooter }) => {
  return (
    <div className={`volume-manager ${isOnFooter ? 'd-flex align-items-center' : ''}`}>
      <FaVolumeUp className="me-2 text-muted" />
      <input type="range" className="form-range" />
    </div>
  );
};
export default VolumeManager;
