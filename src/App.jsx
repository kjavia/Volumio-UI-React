import ReelToReelPlayer from './components/animated-players/ReelToReelPlayer';

const App = () => {
    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <h1>Volumio UI React</h1>
                    <div className="my-5">
                        <ReelToReelPlayer isPlaying={true} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
