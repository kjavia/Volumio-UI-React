import useAlbumColor from '@/hooks/useAlbumColor';
import './cassette-player.scss';

const CassettePlayer = ({ isPlaying, albumArt, title, artist }) => {
  const displayArtist = (artist || '').toUpperCase() || '\u00a0';
  const displayTitle = (title || '').toUpperCase() || '\u00a0';

  const { color: labelColor, contrastColor: labelTextColor } = useAlbumColor(albumArt);

  return (
    <div className="cassette-container">
      <div className={`cassette ${isPlaying ? 'is-playing' : ''}`}>
        <div className="top-tape">
          <div className="brand-mark">SONY</div>
        </div>

        <div className="medium-tape">
          <div className="label-container">
            <div className="label">
              <div className="top-label">
                <div className="predefined-text">INDEX</div>
                <div className="top-text">
                  <div className="top-text__artist">{displayArtist}</div>
                  <div className="top-text__title">{displayTitle}</div>
                </div>
              </div>

              <div className="medium-label" style={{ background: labelColor }}>
                <div className="side-name" style={{ color: labelTextColor }}>A</div>

                <div className="gap-container">
                  <div className="gap">
                    <div className="tapereel left">
                      <div className="notch notch-1"></div>
                      <div className="notch notch-2"></div>
                      <div className="notch notch-3"></div>
                    </div>

                    <div className="central-gap">
                      <div className="innertape left"></div>
                      <div className="innertape right"></div>
                    </div>

                    <div className="tapereel right">
                      <div className="notch notch-1"></div>
                      <div className="notch notch-2"></div>
                      <div className="notch notch-3"></div>
                    </div>
                  </div>
                </div>

                <div className="noise-reduction">
                  NOISE REDUCTION
                  <div className="box">
                    <div>ON</div>
                    <div>OFF</div>
                  </div>
                </div>
              </div>

              <div className="bottom-label">
                <div className="brand-text">
                  <div className="maintext">SONY</div>
                  <div className="subtext">TYPE I (NORMAL) POSITION</div>
                </div>
                <div className="arrow-text"><span>🡆</span></div>
                <div className="model-text"><span>AHF</span>46</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bottom-tape">
          <div className="magnetic-shield-container">
            <div className="magnetic-shield">
              <div className="left-hole-container">
                <div className="hole hole-1"></div>
                <div className="hole hole-2"></div>
              </div>
              <div className="screw-container">
                <div className="screw"></div>
              </div>
              <div className="right-hole-container">
                <div className="hole hole-3"></div>
                <div className="hole hole-4"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="screw screw-1"><div className="dot"></div></div>
        <div className="screw screw-2"><div className="dot"></div></div>
        <div className="screw screw-3"><div className="dot"></div></div>
        <div className="screw screw-4"><div className="dot"></div></div>
      </div>
    </div>
  );
};


export default CassettePlayer;
