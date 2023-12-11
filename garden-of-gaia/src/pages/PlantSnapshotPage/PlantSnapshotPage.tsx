import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Container } from '@mui/material';
import fetchSnapshotData from '../../utils/fetchSnapshotData';

const PlantSnapshotPage: React.FC = () => {
    const [plantSnapshots, setPlantSnapshots] = useState<any[]>([]);


    useEffect(() => {
        fetchSnapshotData(`${process.env.REACT_APP_SERVER_API_URL}/api/plant-snapshots`, setPlantSnapshots);
    }, []);

    return (
        <Container maxWidth="md" sx={{ marginTop: 4 }}>
            <Typography variant="h3" gutterBottom component="div">
                Plant Snapshots
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                <TableHead>
                    <TableRow>
                        <TableCell><b>Area</b></TableCell>
                        <TableCell><b>Bed</b></TableCell>
                        <TableCell><b>Plant Name</b></TableCell>
                        <TableCell><b>Notes</b></TableCell>
                        <TableCell><b>Status</b></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {plantSnapshots.map((snapshot) => (
                        <TableRow key={snapshot.id}>
                            <TableCell>{snapshot.area}</TableCell>
                            <TableCell>{snapshot.bed}</TableCell>
                            <TableCell>{snapshot.plant_name}</TableCell>
                            <TableCell>{snapshot.notes}</TableCell>
                            <TableCell>{snapshot.plant_status}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default PlantSnapshotPage;