import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import MapPage from './pages/MapPage/MapPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import PlantTrackerPage from './pages/PlantTrackerPage/PlantTrackerPage';
import WalkthroughPage from './pages/WalkthroughPage/WalkthroughPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/planttracker" element={<PlantTrackerPage />} />
          <Route path="/walkthrough" element={<WalkthroughPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;