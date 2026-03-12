import { useState } from 'react';
import Button from './components/Button.jsx';
import VinylPlayer from './components/animated-players/VinylPlayer.jsx';
import CdCoverPlayer from './components/animated-players/CdCoverPlayer.jsx';
import CdPlayer from './components/animated-players/CdPlayer.jsx';
import classNames from 'classnames';

const App = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  return (
    <div className="container-fluid">
      <h1 className="my-5">Volumio UI React</h1>
      <div className="row my-5">
        <div className="col-6">
          <CdPlayer isPlaying={isPlaying} />
        </div>
        <div className="col-6">
          <Button classNames="btn-square primary-text" onClick={() => setIsPlaying(!isPlaying)}>
            <div className={classNames('led', { on: isPlaying })}></div>
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default App;
