// utils/useRefreshData.ts
import { useState, useCallback } from 'react';
import fetchData from './fetchData';
// import fetchSnapshotData from '../../utils/fetchSnapshotData';

export const useRefreshData = (selectedAreaId: number, selectedBed: string) => {
    const [plantSnapshots, setPlantSnapshots] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);

    const handleRefresh = useCallback(() => {
        if (selectedAreaId) {
            const bedQuery = selectedBed !== 'All Beds' ? `&bed=${encodeURIComponent(selectedBed)}` : '';
            fetchData(`${process.env.REACT_APP_SERVER_API_URL}/api/plant-snapshots?area_id=${selectedAreaId}${bedQuery}`, setPlantSnapshots);
            fetchData(`${process.env.REACT_APP_SERVER_API_URL}/api/tasks?area_id=${selectedAreaId}${bedQuery}`, setTasks);
        }
    }, [selectedAreaId, selectedBed]);

    return { plantSnapshots, setPlantSnapshots, tasks, setTasks, handleRefresh };
};