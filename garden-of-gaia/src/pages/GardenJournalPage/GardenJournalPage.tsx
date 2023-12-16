import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, TextField, Container } from '@mui/material';
import fetchGardenJournalData from '../../utils/fetchGardenJournalData';
import Chatbox from '../../components/Chatbox';

// Define a type for the entries
type EntryType = {
    id: number;
    date: string;
    location: string;
    datetime: string;
    location_id: number;
    plant_name?: string;
    action_category?: string;
    username?: string;
    current_location?: string;
    notes: string;
};

const GardenJournalPage: React.FC = () => {
    const [gardenJournal, setGardenJournal] = useState<EntryType[]>([]);
    const [plantTracker, setPlantTracker] = useState<EntryType[]>([]);
    const [filter, setFilter] = useState(''); // State variable for the filter input
    const [tempFilter, setTempFilter] = useState(''); // Temporary state for the input value

    useEffect(() => {
        fetchGardenJournalData(`${process.env.REACT_APP_SERVER_API_URL}/api/observations`, setGardenJournal);
        fetchGardenJournalData(`${process.env.REACT_APP_SERVER_API_URL}/api/plant_tracker`, setPlantTracker);
    }, []);

    // Function to handle Enter key press
    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            setFilter(tempFilter);
        }
    };

    // Combine both datasets and sort by date
    const combinedData = [...gardenJournal, ...plantTracker]

    // Apply the filter only if filter string is not empty
    const filteredData = tempFilter 
        ? plantTracker.filter(entry => entry.plant_name?.toLowerCase() === tempFilter.toLowerCase())
        : combinedData;

    filteredData.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const isPlantTrackerEntry = (entry: EntryType) => entry.plant_name || entry.action_category;

    return (
        <Container maxWidth="md" sx={{ marginTop: 4 }}>
            <Typography variant="h3" gutterBottom component="div">
                Garden Journal
            </Typography>
            <TextField
                label="Filter by Plant Name"
                variant="outlined"
                value={tempFilter}
                onChange={(e) => setTempFilter(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{ marginBottom: 2 }}
            />
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><b>Date</b></TableCell>
                            <TableCell><b>Location ID</b></TableCell>
                            <TableCell><b>Username / Plant Name</b></TableCell>
                            <TableCell><b>Current Location / Action Category</b></TableCell>
                            <TableCell><b>Notes</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredData.map((entry) => (
                            <TableRow key={entry.id} style={isPlantTrackerEntry(entry) ? { fontStyle: 'italic', backgroundColor: '#e8f5e9' } : {}}>
                                <TableCell>{entry.date}</TableCell>
                                <TableCell>{entry.location_id}</TableCell>
                                <TableCell>{entry.plant_name || entry.username || ''}</TableCell>
                                <TableCell>{entry.action_category || entry.current_location || ''}</TableCell>
                                <TableCell>{entry.notes}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            
        </Container>
    );
};

export default GardenJournalPage;
