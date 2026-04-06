import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Player from './pages/Player';
import PlaylistManager from './pages/PlaylistManager';
import useLanguageSync from './hooks/useLanguageSync';
// import './App.scss'; // Assuming you might have app-specific styles or use index.scss

// Inner component — rendered inside SocketProvider so hooks can access context.
const AppInner = () => {
  useLanguageSync();
  return (
    <Router>
      <div className="d-flex flex-column h-100 bg-dark">
        <main className="flex-grow-1 d-flex flex-column overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/player" element={<Player />} />
            <Route path="/playlist-manager" element={<PlaylistManager />} />
            {/* Add more routes as needed */}
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const AppContent = () => {
  return (
    <SocketProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </SocketProvider>
  );
};

export default AppContent;
