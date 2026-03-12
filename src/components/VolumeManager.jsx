import React from 'react';

const VolumeManager = ({ isOnFooter }) => {
  return (
    <div className={`volume-manager ${isOnFooter ? 'd-flex align-items-center' : ''}`}>
      <span className="material-icons me-2 text-muted">volume_up</span>
      <input type="range" className="form-range" />
    </div>
  );
};
export default VolumeManager;
