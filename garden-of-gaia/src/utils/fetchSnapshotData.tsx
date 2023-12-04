const fetchSnapshotData = async (url: string, setData: React.Dispatch<React.SetStateAction<any[]>>) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        console.log('Fetched data:', data);

        const areaResponse = await fetch(`${process.env.REACT_APP_SERVER_API_URL}/api/areas`);
        const areas = await areaResponse.json();
        console.log('Fetched areas:', areas);

        const bedResponse = await fetch(`${process.env.REACT_APP_SERVER_API_URL}/api/garden_locations`);
        const beds = await bedResponse.json();
        console.log('Fetched beds:', beds);

        const enhancedData = data.map((snapshot: any) => {
            const area = areas.find((area: any) => area.area_id === snapshot.area_id);
            const bed = beds.find((bed: any) => bed.id === snapshot.location_id);

            //console.log("area: ", area)
            //console.log("bed: ", bed)

            return {
                ...snapshot,
                area: area ? area.area_name : 'N/A',
                bed: bed ? bed.bed : 'N/A',
            };
        });
        setData(enhancedData);
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
    }
};

export default fetchSnapshotData;