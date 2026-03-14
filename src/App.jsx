import { SocketProvider } from './contexts/SocketContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
// import './App.scss'; // Assuming you might have app-specific styles or use index.scss

const App = () => {
  return (
    <SocketProvider>
      <Router>
        <div className="d-flex flex-column vh-100 bg-dark">
          <main className="flex-grow-1 d-flex flex-column overflow-hidden">
            <Routes>
              <Route path="/" element={<Home />} />
              {/* Add more routes as needed */}
            </Routes>
          </main>
        </div>
      </Router>
    </SocketProvider>
  );
};

export default App;
