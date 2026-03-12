import React from 'react';
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from 'react-icons/fa';

const PlayerButtons = ({ isInFooter }) => {
  return (
    <div
      className={`player-buttons ${isInFooter ? 'text-center' : ''} d-flex gap-2 justify-content-center`}
    >
      <button className="btn btn-outline-light btn-sm">
        <FaStepBackward />
      </button>
      <button className="btn btn-primary btn-sm">
        <FaPlay />
      </button>
      {/* <button className="btn btn-primary"><FaPause /></button> */}
      <button className="btn btn-outline-light btn-sm">
        <FaStepForward />
      </button>
    </div>
  );
};
export default PlayerButtons;
