// src/pages/MapPage/MapPage.tsx

import React, { useEffect, useState } from 'react';
import FarmMap from '../../components/FarmMap'; // Adjust the path as necessary

const MapPage: React.FC = () => {
    const [observations, setObservations] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3001/api/area-tracker-raw')
            .then(response => response.json())
            .then(data => setObservations(data))
            .catch(error => console.error('Error:', error));
    }, []);

    return (
        <div>
            <h1>Map</h1>
            <FarmMap observations={observations} />
        </div>
    );
};

export default MapPage;