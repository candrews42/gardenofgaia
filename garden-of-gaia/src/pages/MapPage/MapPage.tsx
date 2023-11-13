// src/pages/MapPage/MapPage.tsx

import React from 'react';
import FarmMap from '../../components/FarmMap'; // Adjust the path as necessary

const MapPage: React.FC = () => {
    return (
        <div>
            <h1>Map</h1>
            <FarmMap />
        </div>
    );
};

export default MapPage;