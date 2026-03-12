import { useState } from 'react';
import Button from './components/Button.jsx';
import VinylPlayer from './components/animated-players/VinylPlayer.jsx';

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <div className="container-fluid">
      <div className="row my-5">
        <div className="col-12">
          <h1 className="my-5">Volumio UI React</h1>
          <VinylPlayer isPlaying={isPlaying} />
        </div>
      </div>
      <Button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'Pause' : 'Play'}</Button>
    </div>
  );
};

export default App;
