import React from 'react';

const PlayerButtons = ({ isInFooter }) => {
  return (
    <div
      className={`player-buttons ${isInFooter ? 'text-center' : ''} d-flex gap-2 justify-content-center`}
    >
      <button className="btn btn-outline-light btn-sm">
        <span className="material-icons">skip_previous</span>
      </button>
      <button className="btn btn-primary btn-sm">
        <span className="material-icons">play_arrow</span>
      </button>
      {/* <button className="btn btn-primary"><span className="material-icons">pause</span></button> */}
      <button className="btn btn-outline-light btn-sm">
        <span className="material-icons">skip_next</span>
      </button>
    </div>
  );
};
export default PlayerButtons;
