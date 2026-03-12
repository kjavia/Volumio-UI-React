import React from 'react';

const TrackInfo = ({ isInFooter }) => {
  return (
    <div className={`track-info ${isInFooter ? 'text-center' : ''}`}>
      <h5 className="mb-0 text-truncate">Track Title</h5>
      <p className="mb-0 text-muted small text-truncate">Artist Name</p>
    </div>
  );
};
export default TrackInfo;
