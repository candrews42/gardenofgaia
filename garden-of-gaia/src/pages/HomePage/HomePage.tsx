// src/pages/HomePage/HomePage.tsx

import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div>
      <h1>Welcome to the Garden of Gaia</h1>
      <nav>
        <Link to="/walkthrough">Walkthrough</Link><br />
        <Link to="/map">View Map</Link><br />
        {/* <Link to="/planttracker">Plant Tracker</Link><br />   */}
        <Link to="/plantsnapshot">Plant Snapshot</Link><br />
        {/* <Link to="/dashboard">Dashboard</Link><br /> */}
      </nav>
    </div>
  );
};

export default HomePage;
