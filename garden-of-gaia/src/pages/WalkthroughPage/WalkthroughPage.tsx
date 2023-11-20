import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Tooltip, Container } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

interface GardenLocation {
  id: number;
  area: string;
  bed: string;
}

const WalkthroughPage: React.FC = () => {
    const [gardenLocations, setGardenLocations] = useState<GardenLocation[]>([]);
    const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
    const [notes, setNotes] = useState('');
    const [username, setUsername] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [autoFilledLocation, setAutoFilledLocation] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedBed, setSelectedBed] = useState('');

    // get location
    // get the current location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
        setAutoFilledLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
        }, (error) => {
        console.error('Error obtaining location', error);
        });
    }, []);

    // get garden locations
    useEffect(() => {
        fetch('http://localhost:3001/api/garden-locations')
            .then(response => response.json())
            .then((data: GardenLocation[]) => setGardenLocations(data))
            .catch(error => console.error('Error fetching garden locations:', error));
    }, []);

    // Create a unique list of areas for the Area dropdown
    const uniqueAreas = Array.from(new Set(gardenLocations.map(location => location.area)));
    // When an area is selected, get unique beds for that area
    const bedsForSelectedArea = Array.from(new Set(gardenLocations
        .filter(location => location.area === selectedArea)
        .map(location => location.bed)));

    useEffect(() => {
        fetch('http://localhost:3001/api/garden-locations')
            .then(response => response.json())
            .then((data: GardenLocation[]) => {
                setGardenLocations(data);
                if (data.length > 0) {
                    setSelectedArea(data[0].area);
                    setSelectedBed(data[0].bed);
                }
            })
            .catch(error => console.error('Error fetching garden locations:', error));
    }, []);
   
    
    useEffect(() => {
    fetch('http://localhost:3001/api/garden-locations')
        .then(response => response.json())
        .then((data: GardenLocation[]) => setGardenLocations(data))
        .catch(error => console.error('Error fetching garden locations:', error));
    }, []);

    // handle image change
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setImage(event.target.files[0]);
        }
    };

    // handle date change
    // const handleDateChange = (newDate: Date | null) => {
    //     setSelectedDate(newDate);
    // };

    // fetch plant snapshots 
    const [plantSnapshots, setPlantSnapshots] = useState<any[]>([]); // Add a state for plant snapshots
    // Fetch plant snapshots when the selected bed changes
    useEffect(() => {
        if (selectedArea && selectedBed) {
            fetch(`http://localhost:3001/api/plant-snapshots?area=${selectedArea}&bed=${selectedBed}`)
                .then(response => response.json())
                .then(data => setPlantSnapshots(data))
                .catch(error => console.error('Error fetching plant snapshots:', error));
        }
    }, [selectedArea, selectedBed]); // Dependency array includes selectedArea and selectedBed

    // fetch task list
    const [tasks, setTasks] = useState<any[]>([]);
    useEffect(() => {
        if (selectedArea && selectedBed) {
            fetch(`http://localhost:3001/api/tasks?area=${selectedArea}&bed=${selectedBed}`)
                .then(response => response.json())
                .then(data => setTasks(data))
                .catch(error => console.error('Error fetching tasks:', error));
        }
    }, [selectedArea, selectedBed]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Find the location_id that matches both the selected area and bed
        const selectedLocation = gardenLocations.find(location => 
            location.area === selectedArea && location.bed === selectedBed
            
        );
        if (!selectedLocation) {
            console.error('Error: Location not found');
            return;
        }   

        const formData = new FormData();
        formData.append('date', new Date().toISOString().slice(0, 10));
        formData.append('location_id', selectedLocation.id.toString()); // Updated to use the correct location_id
        // formData.append('location_id', gardenLocations[currentLocationIndex].id.toString());
        formData.append('notes', notes);
        formData.append('username', username);
        formData.append('current_location', autoFilledLocation);
        
        if (image) {
            formData.append('image', image);
        }

        Array.from(formData.entries()).forEach(([key, value]) => {
            console.log(key, value);
        });

        try {
            await fetch('http://localhost:3001/api/area-tracker-raw', {
                method: 'POST',
                body: formData, // FormData is used for file upload
            });
    
            // Find the next index based on the selected bed
            const currentIndex = gardenLocations.findIndex(location => 
                location.area === selectedArea && location.bed === selectedBed
            );
            const nextIndex = currentIndex; //+ 1;

            if (nextIndex < gardenLocations.length) {
                setSelectedArea(gardenLocations[nextIndex].area);
                setSelectedBed(gardenLocations[nextIndex].bed);
                setCurrentLocationIndex(nextIndex);
            } else {
                // Handle the end of the list case
            }
        } catch (error) {
            console.error('Error submitting walkthrough form:', error);
        }
    };
    

    if (currentLocationIndex >= gardenLocations.length) {
        return <div>Walkthrough complete!</div>;
    }

    return (
        <Box sx={{
            padding: 0.5, // Adds padding around the content
            maxWidth: '800px', // Sets a max-width for the container
            margin: 'auto', // Centers the container
          }}>
            <h1>Garden Walkthrough</h1>
            <form onSubmit={handleSubmit}>
                {/* Area Dropdown */}
                <Select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    fullWidth
                    margin="dense"
                >
                    {uniqueAreas.map(area => (
                        <MenuItem key={area} value={area}>{area}</MenuItem>
                    ))}
                </Select>

                {/* Bed Dropdown */}
                <Select
                    value={selectedBed}
                    onChange={(e) => setSelectedBed(e.target.value)}
                    fullWidth
                    margin="dense"
                    disabled={!selectedArea}
                >
                    {bedsForSelectedArea.map(bed => (
                        <MenuItem key={bed} value={bed}>{bed}</MenuItem>
                    ))}
                </Select>
                <TextField
                    label="Your Name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    margin="normal"
                    fullWidth
                />
                <TextField
                    label="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    margin="normal"
                    fullWidth
                    multiline
                    rows={4}
                />
                {/* <DateTimePicker
                    label="Date and Time"
                    value={selectedDate}
                    onChange={handleDateChange}
                    renderInput={(params: TextFieldProps) => <TextField {...params} fullWidth margin="normal" />}
                /> */}
                <TextField
                    label="Current Location"
                    value={autoFilledLocation}
                    margin="normal"
                    fullWidth
                    InputProps={{
                        readOnly: true,
                    }}
                />
                <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="icon-button-file"
                    type="file"
                    onChange={handleImageChange}
                />
                <label htmlFor="icon-button-file">
                    <IconButton color="primary" aria-label="upload picture" component="span">
                        <PhotoCamera />
                    </IconButton>
                </label>
                {image && <p>Image selected: {image.name}</p>}
                <br />
                <Button type="submit" variant="contained" color="primary">
                    {currentLocationIndex < gardenLocations.length - 1 ? 'Submit' : 'Submit'}
                </Button>
                <br />
                {/* Display plant snapshots */}
                <TableContainer component={Paper} style={{ marginTop: '20px' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Plant Name</b></TableCell>
                                <TableCell><b>Notes</b></TableCell>
                                <TableCell><b>Status</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {plantSnapshots.map((snapshot) => (
                                <TableRow key={snapshot.id}>
                                    <TableCell>{snapshot.plant_name}</TableCell>
                                    <TableCell>{snapshot.notes}</TableCell>
                                    <TableCell style={{ fontWeight: 'bold' }}>
                                        {snapshot.plant_status}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Display active task list */}
                <TableContainer component={Paper} style={{ marginTop: '20px' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Task Description</b></TableCell>
                                <TableCell><b>Status</b></TableCell>
                                {/* Add more headers if needed */}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tasks.map((task) => (
                                <TableRow key={task.id}>
                                    <TableCell>{task.task_description}</TableCell>
                                    <TableCell style={{ fontWeight: task.status === 'completed' ? 'bold' : 'normal', color: task.status === 'completed' ? 'green' : 'black' }}>
                                        {task.status}
                                    </TableCell>
                                    {/* Add more cells if needed */}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </form>
            <br />
            <br />
            <br />
            <br />
        </Box>
    );
};

export default WalkthroughPage;
