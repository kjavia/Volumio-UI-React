import Button from './Button';

const AlbumBrowser = ({ albums }) => {
  return (
    <div className="album-browser-page">
      <div className="browser-casing">
        {/* <!-- Screen Area --> */}
        <div className="screen-frame">
          <div className="nav-bar">
            <div className="screen-title">Library / Albums</div>
            <div className="search-bar">
              <span className="material-icons" style={{ fontSize: '14px' }}>
                search
              </span>
              <span>Search...</span>
            </div>
          </div>

          <div className="album-list-scroll">
            <div className="album-grid">
              {/* <!-- Album 1 --> */}
              {albums.map((album, index) => (
                <div className="album-card" key={index}>
                  <div className="album-art"></div>
                  <div className="album-info">
                    <div className="album-title">{album.title}</div>
                    <div className="album-artist">{album.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* <!-- External Hardware Controls --> */}
        <div className="browser-controls">
          <button className="btn-square" title="Back">
            <span className="material-icons">arrow_back</span>
          </button>

          {/* <!-- Pagination / View Toggle using buttons --> */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button>
              <span className="material-icons">list</span>
            </Button>
            <Button className="inverted" title="Grid View">
              <span className="material-icons">grid_view</span>
            </Button>
          </div>

          <Button title="Home">
            <span className="material-icons">home</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

AlbumBrowser.propTypes = {};

export default AlbumBrowser;
