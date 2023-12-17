// utils/useGardenLocations.ts
import { useState, useEffect } from 'react';
import fetchData from './fetchData';

export const useGardenLocations = (selectedArea: string, selectedLocation: string) => {
    // get garden locations
    interface GardenLocation {
        location_id: number;
        area_name: string;
        location_name: string;
        area_id: number;
    }
    const [gardenLocations, setGardenLocations] = useState<GardenLocation[]>([]);
    const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

    useEffect(() => {
        fetchData(`${process.env.REACT_APP_SERVER_API_URL}/api/garden-locations`, setGardenLocations);
    }, []);

    useEffect(() => {
        if (selectedArea && selectedLocation) {
            const parsedLocation = gardenLocations.find(location => 
                location.area_name === selectedArea && location.location_name === selectedLocation
            );
        if (parsedLocation) {
            setSelectedAreaId(parsedLocation.area_id);
            setSelectedLocationId(parsedLocation.location_id);
        }
        }
    }, [selectedArea, selectedLocation, gardenLocations]);

    return { gardenLocations, selectedAreaId, selectedLocationId };
};