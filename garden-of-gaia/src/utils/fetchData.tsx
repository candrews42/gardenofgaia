// fetch data util
const fetchData = async (url: string, setData: React.Dispatch<React.SetStateAction<any[]>>) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setData(data);
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
    }
};

export default fetchData;