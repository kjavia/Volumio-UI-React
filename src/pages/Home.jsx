import VinylCoverPlayer from '@/components/animated-players/VinylCoverPlayer';

const Home = () => {
  return (
    <div className="container-fluid">
      <div className="player-casing">
        {/* WRAPPER 1: Media Info / Visualizer */}
        <div className="media-section">
          <VinylCoverPlayer isPlaying />
        </div>

        {/* WRAPPER 2: Controls */}
        <div className="controls-section">{/* Controls can go here */}</div>
      </div>
    </div>
  );
};

export default Home;
