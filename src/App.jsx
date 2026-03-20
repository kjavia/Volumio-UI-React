import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Player from './pages/Player';
// import './App.scss'; // Assuming you might have app-specific styles or use index.scss

const App = () => {
  return (
    <SocketProvider>
      <ThemeProvider>
        <Router>
          <div className="d-flex flex-column h-100 bg-dark">
            <main className="flex-grow-1 d-flex flex-column overflow-hidden">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/player" element={<Player />} />
                {/* Add more routes as needed */}
              </Routes>
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </SocketProvider>
  );
};

export default App;
