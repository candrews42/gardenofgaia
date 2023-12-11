import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import MapPage from './pages/MapPage/MapPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import PlantTrackerPage from './pages/PlantTrackerPage/PlantTrackerPage';
import WalkthroughPage from './pages/WalkthroughPage/WalkthroughPage';
import PlantSnapshotPage from './pages/PlantSnapshotPage/PlantSnapshotPage';
import GardenJournalPage from './pages/GardenJournalPage/GardenJournalPage';
import TaskManagerPage from './pages/TaskManagerPage/TaskManagerPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/gardenjournal" element={<GardenJournalPage />} />
          <Route path="/taskmanager" element={<TaskManagerPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/planttracker" element={<PlantTrackerPage />} />
          <Route path="/walkthrough" element={<WalkthroughPage />} />
          <Route path="/plantsnapshot" element={<PlantSnapshotPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;