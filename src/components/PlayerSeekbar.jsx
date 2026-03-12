import React from 'react';

const PlayerSeekbar = () => {
  return (
    <div className="player-seekbar text-center px-2">
      <input type="range" className="form-range" value="30" readOnly />
    </div>
  );
};
export default PlayerSeekbar;
