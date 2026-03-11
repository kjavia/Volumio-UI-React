import VinylCoverPlayer from "./components/animated-players/VinylCoverPlayer.jsx";

const App = () => {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <h1 className="my-5">Volumio UI React</h1>
          <VinylCoverPlayer isPlaying/>
        </div>
      </div>
    </div>
  );
};

export default App;
