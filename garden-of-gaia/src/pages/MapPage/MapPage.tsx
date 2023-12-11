// src/pages/MapPage/MapPage.tsx

import React, { useEffect, useState } from 'react';
import FarmMap from '../../components/FarmMap'; // Adjust the path as necessary

const MapPage: React.FC = () => {
    const [observations, setObservations] = useState([]);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_SERVER_API_URL}/api/observations`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
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