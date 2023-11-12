import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import MapPage from './pages/MapPage/MapPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import PlantTrackerPage from './pages/PlantTrackerPage/PlantTrackerPage';
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;