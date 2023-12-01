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
import { Snackbar, Alert } from '@mui/material'; // Import Snackbar and Alert
import DeleteIcon from '@mui/icons-material/Delete';


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
    // for editable tables
    interface EditableCell {
        rowId: number | null;
        column: string | null;
    }
    const [editableCell, setEditableCell] = useState<EditableCell>({ rowId: null, column: null });
    const [editableValue, setEditableValue] = useState('');


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
    const [displayColumns, setDisplayColumns] = useState({
        assignee: false,
        dueDate: false,
        priority: false,
      });
    useEffect(() => {
        const fetchTasks = async () => {
          try {
            const response = await fetch(`http://localhost:3001/api/tasks?area=${encodeURIComponent(selectedArea)}&bed=${encodeURIComponent(selectedBed)}`);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            } else {
              const data = await response.json();
              setTasks(data);
            }
          } catch (error) {
            console.error("Error fetching tasks:", error);
          }
        };
      
        if (selectedArea && selectedBed) {
          fetchTasks();
        }
      }, [selectedArea, selectedBed]);

      useEffect(() => {
        // Check which columns have non-empty values
        const columnsToShow = tasks.reduce(
          (cols, task) => {
            return {
              assignee: cols.assignee || !!task.assignee,
              dueDate: cols.dueDate || !!task.due_date,
              priority: cols.priority || !!task.priority,
            };
          },
          { assignee: false, dueDate: false, priority: false }
        );
        setDisplayColumns(columnsToShow);
      }, [tasks]);

    // get plant snapshots function
    const fetchPlantSnapshots = async () => {
        // Logic to fetch plant snapshots
        try {
            const response = await fetch(`http://localhost:3001/api/plant-snapshots?area=${encodeURIComponent(selectedArea)}&bed=${encodeURIComponent(selectedBed)}`);
            if (!response.ok) throw new Error('Failed to fetch plant snapshots');
            const data = await response.json();
            setPlantSnapshots(data);
        } catch (error) {
            console.error('Error fetching plant snapshots:', error);
        }
    };

    // get tasks function
    const fetchTasks = async () => {
        // Logic to fetch tasks
        try {
            const response = await fetch(`http://localhost:3001/api/tasks?area=${encodeURIComponent(selectedArea)}&bed=${encodeURIComponent(selectedBed)}`);
            if (!response.ok) throw new Error('Failed to fetch tasks');
            const data = await response.json();
            setTasks(data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    // useEffect hooks to call fetchPlantSnapshots and fetchTasks
    useEffect(() => {
        if (selectedArea && selectedBed) {
            fetchPlantSnapshots();
            fetchTasks();
        }
    }, [selectedArea, selectedBed]);

    const handleRefresh = () => {
        fetchPlantSnapshots();
        fetchTasks();
    };

    // deletable rows
    const handleDeleteSnapshot = async (snapshotId: number) => {
        try {
            // Find the details of the snapshot to be deleted
            const snapshotToDelete = plantSnapshots.find(snapshot => snapshot.id === snapshotId);
            if (!snapshotToDelete) {
                console.error('Error: Snapshot not found');
                return;
            }
            
    
            // Prepare data for plant_tracker
            const plantTrackerData = {
                date: new Date().toISOString().slice(0, 10),
                location_id: snapshotToDelete.location_id, // Assuming this field exists
                plant_id: snapshotToDelete.plant_id, // Assuming this field exists
                action_category: 'removal',
                notes: 'removed from garden bed',
                 // If applicable
                plant_name: snapshotToDelete.plant_name // Use the plant name from the snapshot
            };
            console.log(plantTrackerData)
    
            // Add an entry to plant_tracker for the removal
            const plantTrackerResponse = await fetch('http://localhost:3001/api/plant-tracker', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(plantTrackerData)
            });
    
            if (!plantTrackerResponse.ok) {
                throw new Error(`HTTP error! status: ${plantTrackerResponse.status}`);
            }
    
            // Delete the snapshot
            const deleteResponse = await fetch(`http://localhost:3001/api/plant-snapshots/${snapshotId}`, {
                method: 'DELETE',
            });
    
            if (!deleteResponse.ok) {
                throw new Error(`HTTP error! status: ${deleteResponse.status}`);
            }
    
            // Remove the snapshot from the state
            setPlantSnapshots(plantSnapshots.filter(snapshot => snapshot.id !== snapshotId));
            console.log(`Snapshot with id ${snapshotId} deleted.`);
        } catch (error) {
            console.error('Error in handleDeleteSnapshot:', error);
        }
    };
    
    

    // editable tables
    const handleEditStart = (rowId: number, column: string, value: any) => {
        setEditableCell({ rowId, column });
        setEditableValue(value);
      };
      
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
          handleSubmitEdit();
        }
      };

    
    const handleSubmitEdit = async () => {
        try {
            // Find the snapshot being edited
            const editedSnapshot = plantSnapshots.find(snapshot => snapshot.id === editableCell.rowId);
            if (!editedSnapshot) {
                console.error('Error: Snapshot not found');
                return;
            }

            // Find the location_id that matches both the selected area and bed
            const selectedLocation = gardenLocations.find(location => 
                location.area === selectedArea && location.bed === selectedBed
                
            );
            if (!selectedLocation) {
                console.error('Error: Location not found');
                return;
            }   
            
            // First update the plant_snapshot notes
            const response = await fetch('http://localhost:3001/api/update-plant-snapshot-notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    snapshotId: editableCell.rowId, 
                    newNotes: editableValue 
                }),
            });
    
            const updatedSnapshot = await response.json();
            console.log('Updated snapshot:', updatedSnapshot);
    
            // Update the plantSnapshots state with the new notes
            const updatedSnapshots = plantSnapshots.map(snapshot =>
                snapshot.id === editableCell.rowId ? { ...snapshot, notes: updatedSnapshot.notes } : snapshot
            );
            setPlantSnapshots(updatedSnapshots);
    
            // Now add an entry to plant_tracker
            const plantTrackerData = {
                date: new Date().toISOString().slice(0, 10),
                location_id: selectedLocation, // Assuming this is part of your snapshot
                plant_id: editedSnapshot.plant_id, // Assuming this is part of your snapshot
                action_category: 'manual',
                notes: editableValue,
                picture: editedSnapshot.picture, // If applicable
                plant_name: editedSnapshot.plant_name // Use the plant name from the snapshot
            };
            console.log("to be submitted", plantTrackerData)

            const plantTrackerResponse = await fetch('http://localhost:3001/api/plant-tracker', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(plantTrackerData)
            });
    
            if (!plantTrackerResponse.ok) {
                throw new Error(`HTTP error! status: ${plantTrackerResponse.status}`);
            }
    
            const newPlantTrackerEntry = await plantTrackerResponse.json();
            console.log('New plant tracker entry added:', newPlantTrackerEntry);
            // Optionally update state or UI based on the new entry
    
        } catch (error) {
            console.error('Error in handleEditSubmit:', error);
        }
    
        // Reset the editable states
        setEditableCell({ rowId: null, column: null });
        setEditableValue('');
    };
    
      
      

    // submit
    const [snackbarOpen, setSnackbarOpen] = useState(false); // State to control Snackbar
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
            const response = await fetch('http://localhost:3001/api/area-tracker-raw', {
                method: 'POST',
                body: formData, // FormData is used for file upload
            });

            setSnackbarOpen(true);
    
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

    const handleSnackbarClose = () => {
        setSnackbarOpen(false); // Close the Snackbar
    };

    
    if (currentLocationIndex >= gardenLocations.length) {
        return <div>Walkthrough complete!</div>;
    }

    return (
        <Container maxWidth="md" sx={{ marginTop: 4 }}>
            <Typography variant="h3" gutterBottom component="div">
                Garden Walkthrough
            </Typography>
            <Typography variant="subtitle1" gutterBottom component="div">
                Follow the steps to record your observations for each area and bed in the garden.
            </Typography>
            
            <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ width: 'auto', marginRight: 2 }}>
                    Area:
                    </Typography>
                    <Select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    displayEmpty
                    fullWidth
                    renderValue={selectedArea !== '' ? undefined : () => <em>Area</em>}
                    >
                    <MenuItem value="" disabled>Select Area</MenuItem>
                    {uniqueAreas.map(area => (
                        <MenuItem key={area} value={area}>{area}</MenuItem>
                    ))}
                    </Select>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ width: 'auto', marginRight: 2 }}>
                    Bed:
                    </Typography>
                    <Select
                    value={selectedBed}
                    onChange={(e) => setSelectedBed(e.target.value)}
                    displayEmpty
                    fullWidth
                    disabled={!selectedArea}
                    renderValue={selectedBed !== '' ? undefined : () => <em>Bed</em>}
                    >
                    <MenuItem value="" disabled>Select Bed</MenuItem>
                    {bedsForSelectedArea.map(bed => (
                        <MenuItem key={bed} value={bed}>{bed}</MenuItem>
                    ))}
                    </Select>
                </Box>
            </Box>
            
            <Box sx={{ marginBottom: 2 }}>
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
                </Box>
    
            <Box sx={{ marginBottom: 0 }}>
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
              {image && <Typography variant="caption">Image selected: {image.name}</Typography>}
            </Box>
    
            <Button type="submit" variant="contained" color="primary" sx={{ marginTop: 0 }}>
              {currentLocationIndex < gardenLocations.length - 1 ? 'Submit' : 'Submit'}
            </Button>
          </form>

          <Box sx={{ marginTop: 2 }}>
                <Button variant="outlined" onClick={handleRefresh}>
                    Refresh Tables
                </Button>
            </Box>
          
          <Box sx={{ marginTop: 2 }}>
            <Typography variant="h5" gutterBottom component="div">
              Plant Snapshots
            </Typography>
            <TableContainer component={Paper}>
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
                        {/* Plant Name - Not Editable */}
                        <TableCell style={{ fontWeight: 'bold' }}>
                            {snapshot.plant_name}
                        </TableCell>

                        {/* Notes - Editable */}
                        <TableCell onDoubleClick={() => handleEditStart(snapshot.id, 'notes', snapshot.notes)}>
                            {editableCell.rowId === snapshot.id && editableCell.column === 'notes' ? (
                            <TextField
                                type="text"
                                multiline
                                rows={4}
                                fullWidth
                                value={editableCell.rowId === snapshot.id ? editableValue : snapshot.notes}
                                onChange={(e) => setEditableValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            ) : (
                            snapshot.notes
                            )}
                        </TableCell>

                        {/* Status - Not Editable */}
                        <TableCell>
                            {snapshot.plant_status}
                        </TableCell>
                        <TableCell>
                            <IconButton 
                                aria-label="delete" 
                                color="secondary" 
                                onClick={() => handleDeleteSnapshot(snapshot.id)}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>

              </Table>
            </TableContainer>
          </Box>
    
          <Box sx={{ marginTop: 4 }}>
            <Typography variant="h5" gutterBottom component="div">
                Tasks
            </Typography>
            <TableContainer component={Paper} sx={{ marginBottom: 10 }}>
                <Table>
                <TableHead>
                    <TableRow>
                    <TableCell><b>Task Description</b></TableCell>
                    <TableCell><b>Status</b></TableCell>
                        {displayColumns.assignee && <TableCell><b>Assignee</b></TableCell>}
                        {displayColumns.dueDate && <TableCell><b>Due Date</b></TableCell>}
                        {displayColumns.priority && <TableCell><b>Priority</b></TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tasks.map((task) => (
                    <TableRow key={task.id}>
                        <TableCell>{task.task_description}</TableCell>
                        <TableCell style={{ fontWeight: task.status === 'completed' ? 'bold' : 'normal', color: task.status === 'completed' ? 'green' : 'black' }}>
                        {task.status}
                        </TableCell>
                        {displayColumns.assignee && <TableCell>{task.assignee || '-'}</TableCell>}
                        {displayColumns.dueDate && <TableCell>{task.due_date || '-'}</TableCell>}
                        {displayColumns.priority && <TableCell>{task.priority || '-'}</TableCell>}
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </TableContainer>
          </Box>
          <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ marginBottom: 3 }}
            >
                <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
                    Submission successful!
                </Alert>
            </Snackbar>
        </Container>
      );
    };
    
    export default WalkthroughPage;