import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Container } from '@mui/material';
import fetchGardenJournalData from '../../utils/fetchGardenJournalData';

const GardenJournalPage: React.FC = () => {
    const [gardenJournal, setGardenJournal] = useState<any[]>([]);
    const [plantTracker, setPlantTracker] = useState<any[]>([]);

    useEffect(() => {
        fetchGardenJournalData(`${process.env.REACT_APP_SERVER_API_URL}/api/observations`, setGardenJournal);
        fetchGardenJournalData(`${process.env.REACT_APP_SERVER_API_URL}/api/plant_tracker`, setPlantTracker);
    }, []);

    // Change 'date' to 'datetime' in plantTracker
    const new_gardenJournal = gardenJournal.map(entry => ({
        ...entry,
        datetime: entry.date,
        location_name: entry.location
    }));

    // Combine both datasets and sort by date
    const combinedData = [...new_gardenJournal, ...plantTracker].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return (
        <Container maxWidth="md" sx={{ marginTop: 4 }}>
            <Typography variant="h3" gutterBottom component="div">
                Garden Journal
            </Typography>
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
                        {combinedData.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>{entry.datetime}</TableCell>
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
