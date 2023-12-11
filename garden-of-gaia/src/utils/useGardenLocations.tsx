// utils/useGardenLocations.ts
import { useState, useEffect } from 'react';
import fetchData from './fetchData';

export const useGardenLocations = (selectedArea: string, selectedBed: string) => {
    // get garden locations
    interface GardenLocation {
        id: number;
        area: string;
        bed: string;
        area_id: number;
    }
    const [gardenLocations, setGardenLocations] = useState<GardenLocation[]>([]);
    const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
    const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

    useEffect(() => {
        fetchData(`${process.env.REACT_APP_SERVER_API_URL}/api/garden-locations`, setGardenLocations);
    }, []);

    useEffect(() => {
        if (selectedArea && selectedBed) {
            const selectedLocation = gardenLocations.find(location => 
                location.area === selectedArea && location.bed === selectedBed
            );
        if (selectedLocation) {
            setSelectedAreaId(selectedLocation.area_id);
            setSelectedLocationId(selectedLocation.id);
        }
        }
    }, [selectedArea, selectedBed, gardenLocations]);

    return { gardenLocations, selectedAreaId, selectedLocationId };
};