import React from 'react';
import classNames from 'classnames';
import { useSocket } from '../contexts/SocketContext';
import PlayerSeekbar from './PlayerSeekbar';
import TrackInfo from './TrackInfo';
import PlayerButtons from './PlayerButtons';
import VolumeManager from './VolumeManager';
import AudioOutputs from './AudioOutputs';
import { Link, useLocation } from 'react-router-dom';

const Footer = () => {
  const { isConnected } = useSocket();
  const location = useLocation();
  const showPlayerFooter = location.pathname === '/playback' || true; // Assuming true for now to see it

  if (!isConnected) {
    return null;
  }

  return (
    <footer
      id="footer-content"
      className="fixed-bottom bg-dark text-white border-top border-secondary"
    >
      <div
        id="player-bar"
        className={classNames('player-bar', { 'playback-bar': showPlayerFooter })}
      >
        {/* Desktop Footer */}
        <div
          className={classNames('row align-items-center m-0 p-2 d-none d-md-flex', {
            'd-none': !showPlayerFooter,
          })}
        >
          {/* Seekbar (Hidden on MD/LG/XL in original but shown here for clarity?)
                Wait, original: "lined-seekbar col-xs-24 hidden-md hidden-lg hidden-xl".
                So it's MOBILE ONLY. I'll skip it in this desktop block.
            */}

          {/* Track Info */}
          <div className="track-info-container col-md-4">
            <TrackInfo isInFooter={true} />
          </div>

          {/* Controls */}
          <div className="controls-container col-md-4">
            <PlayerButtons isInFooter={true} />
          </div>

          {/* Volume */}
          <div className="volume-container col-md-3 d-flex align-items-center">
            <VolumeManager isOnFooter={true} />
          </div>

          {/* Play Queue / Outputs Buttons */}
          <div className="play-mode-container col-md-1 d-flex justify-content-end gap-2">
            <Link to="/queue" className="btn btn-link text-white p-0" title="Queue">
              <span className="material-icons">queue_music</span>
            </Link>
            <button className="btn btn-link text-white p-0" title="Outputs">
              <span className="material-icons">speaker_group</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar (when NOT showing player footer) */}
        {/* <div className="d-md-none row m-0 text-center py-2">
             <div className="col">
                <Link to="/browse" className="btn btn-link text-white d-flex flex-column align-items-center">
                    <FaMusic />
                    <span className="small">Browse</span>
                </Link>
             </div>
             ...
        </div> */}

        {/* Mobile Playback Tab Bar (when SHOWING player footer) */}
        <div className={classNames('d-md-none', { 'd-none': !showPlayerFooter })}>
          {/* Seekbar */}
          <div className="lined-seekbar px-2 pt-2">
            <PlayerSeekbar />
          </div>

          {/* Tab Bar Content */}
          <div className="row m-0 text-center py-2">
            <div className="col">
              <Link
                to="/queue"
                className="btn btn-link text-white d-flex flex-column align-items-center p-0"
              >
                <span className="material-icons">queue_music</span>
                <span className="small" style={{ fontSize: '0.7rem' }}>
                  Queue
                </span>
              </Link>
            </div>
            <div className="col">
              <button className="btn btn-link text-white d-flex flex-column align-items-center p-0">
                <span className="material-icons">speaker_group</span>
                <span className="small" style={{ fontSize: '0.7rem' }}>
                  Outputs
                </span>
              </button>
            </div>
            <div className="col-5">
              <VolumeManager isOnFooter={true} />
            </div>
          </div>
        </div>
      </div>
      <AudioOutputs />
    </footer>
  );
};

export default Footer;
