// src/utils/useCurrentLocation.ts
import { useState, useEffect } from 'react';

const useCurrentLocation = () => {
    const [autoFilledLocation, setAutoFilledLocation] = useState('');

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setAutoFilledLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
            }, 
            (error) => {
                console.error('Error obtaining location', error);
            }
        );
    }, []);

    return autoFilledLocation;
};

export default useCurrentLocation;