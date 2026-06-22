import './cd-cover-player.scss';

const CdCoverPlayer = ({ isPlaying, albumArt }) => {
  return (
    <div className="cd-case-container">
      {/* <!-- The CD Disc (Behind) --> */}
      <div className={`cd-disc-spinning ${isPlaying ? 'playing' : ''}`}>
        <div className="cd-surface-glare-spin"></div>
        <div className="cd-inner-ring-spin"></div>
        <div className="cd-hole-spin"></div>
      </div>

      {/* <!-- The Jewel Case (Front) --> */}
      <div className="cd-jewel-case">
        <div className="case-art">
          {albumArt && <img src={albumArt} alt="Album Art" className="case-art-img" />}
        </div>
        <div className="case-glare"></div>
      </div>
    </div>
  );
};


export default CdCoverPlayer;
