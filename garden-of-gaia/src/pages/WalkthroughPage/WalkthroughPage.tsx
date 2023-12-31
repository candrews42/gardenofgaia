import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
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
import useCurrentLocation from '../../utils/useCurrentLocation';
import fetchData from '../../utils/fetchData';
import { useGardenLocations } from '../../utils/useGardenLocations';
import { useRefreshData } from '../../utils/useRefreshData';
import CircularProgress from '@mui/material/CircularProgress';


const WalkthroughPage: React.FC = () => {
    const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
    const [notes, setNotes] = useState('');
    const [username, setUsername] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    // selected area and garden bed
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedBed, setSelectedBed] = useState('');
    const { gardenLocations, selectedAreaId, selectedLocationId } = useGardenLocations(selectedArea, selectedBed);
    // for geolocation
    const autoFilledLocation = useCurrentLocation();
    // plant and task snapshots
    const { plantSnapshots, setPlantSnapshots, tasks, setTasks, handleRefresh } = useRefreshData(selectedAreaId || 0, selectedBed);
    const [isLoading, setIsLoading] = useState(false);

    // table display columns
    const [displayColumns, setDisplayColumns] = useState({
        assignee: false,
        dueDate: false,
        priority: false,
    });
    // for editable tables
    interface EditableCell {
        rowId: number | null;
        column: string | null;
    };
    const [editableCell, setEditableCell] = useState<EditableCell>({ rowId: null, column: null });
    const [editableValue, setEditableValue] = useState('');
    
    // handle date change
    const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newDate = new Date(event.target.value);

        if (!isNaN(newDate.getTime())) {
            // Get the current time
            const currentTime = new Date();

            // Create a new Date object with the selected date and current time
            const dateTime = new Date(
                newDate.getFullYear(),
                newDate.getMonth(),
                newDate.getDate(),
                currentTime.getHours(),
                currentTime.getMinutes(),
                currentTime.getSeconds()
            );

            setSelectedDate(dateTime);
        }
    };

    // understand columns to show
    useEffect(() => {
        const columnsToShow = tasks.reduce(
            (cols, task) => ({
                assignee: cols.assignee || !!task.assignee,
                dueDate: cols.dueDate || !!task.due_date,
                priority: cols.priority || !!task.priority,
            }),
            { assignee: false, dueDate: false, priority: false }
        );
        setDisplayColumns(columnsToShow);
    }, [tasks]);


    useEffect(() => {
        handleRefresh();
    }, [selectedArea, selectedBed]);


    const uniqueAreas = useMemo(() => {
        return Array.from(new Set(gardenLocations.map(location => location.area_name)));
    }, [gardenLocations]);

    const bedsForSelectedArea = useMemo(() => {
        return Array.from(new Set(gardenLocations.filter(location => location.area_name === selectedArea).map(location => location.location_name)));
    }, [gardenLocations, selectedArea]);

    // handle image change
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImage(file);
        }
    };

    // handle date change
    // const handleDateChange = (newDate: Date | null) => {
    //     setSelectedDate(newDate);
    // };

    const createPlantTrackerEntry = async (data: any) => {
        const response = await fetch(`${process.env.REACT_APP_SERVER_API_URL}/api/plant-tracker` , {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
    
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        return response.json();
    };
    
    const handleDeleteSnapshot = async (snapshotId: number) => {
        try {
            const snapshotToDelete = plantSnapshots.find(snapshot => snapshot.id === snapshotId);
            if (!snapshotToDelete) {
                console.error('Error: Snapshot not found');
                return;
            }
    
            const plantTrackerData = {
                date: selectedDate,
                location_id: snapshotToDelete.location_id,
                plant_id: snapshotToDelete.plant_id,
                action_category: 'removal',
                notes: 'removed from garden bed',
                plant_name: snapshotToDelete.plant_name
            };
    
            await createPlantTrackerEntry(plantTrackerData);
    
            const deleteResponse = await fetch(`${process.env.REACT_APP_SERVER_API_URL}/api/plant-snapshots/${snapshotId}`, {
                method: 'DELETE',
            });
    
            if (!deleteResponse.ok) {
                throw new Error(`HTTP error! status: ${deleteResponse.status}`);
            }
    
            setPlantSnapshots(plantSnapshots.filter(snapshot => snapshot.id !== snapshotId));
        } catch (error) {
            console.error('Error in handleDeleteSnapshot:', error);
        }
    };
    
    const handleSubmitEdit = async () => {
        if (editableCell.column === 'notes') {
            try {
                const editedSnapshot = plantSnapshots.find(snapshot => snapshot.id === editableCell.rowId);
                if (!editedSnapshot) {
                    console.error('Error: Snapshot not found');
                    return;
                }
        
                const response = await fetch(`${process.env.REACT_APP_SERVER_API_URL}/api/update-plant-snapshot-notes`, {
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
        
                const updatedSnapshots = plantSnapshots.map(snapshot =>
                    snapshot.id === editableCell.rowId ? { ...snapshot, notes: updatedSnapshot.notes } : snapshot
                );
                setPlantSnapshots(updatedSnapshots);
        
                const plantTrackerData = {
                    date: selectedDate,
                    location_id: selectedLocationId,
                    area_id: selectedAreaId,
                    plant_id: editedSnapshot.plant_id,
                    action_category: 'manual',
                    notes: editableValue,
                    picture: editedSnapshot.picture,
                    plant_name: editedSnapshot.plant_name
                };
        
                await createPlantTrackerEntry(plantTrackerData);
            } catch (error) {
                console.error('Error in handleEditSubmit:', error);
            }
            } else if (editableCell.column === 'task_description') {
                console.log(editableValue)
                try {
                    const response = await fetch(`${process.env.REACT_APP_SERVER_API_URL}/api/tasks/${editableCell.rowId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ newTaskDescription: editableValue }),
                    });
                    console.log(response)
        
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
        
                    const updatedTask = await response.json();
        
                    const updatedTasks = tasks.map(task =>
                        task.id === editableCell.rowId ? { ...task, task_description: updatedTask.task_description } : task
                    );
                    setTasks(updatedTasks);
                } catch (error) {
                    console.error('Error in handleEditSubmit:', error);
                }
            }
        
            setEditableCell({ rowId: null, column: null });
            setEditableValue('');
        };

    const handleDeleteTask = async (taskId: number) => {
        try {
            const deleteResponse = await fetch(`${process.env.REACT_APP_SERVER_API_URL}/api/tasks/${taskId}`, {
                method: 'DELETE',
            });
    
            if (!deleteResponse.ok) {
                throw new Error(`HTTP error! status: ${deleteResponse.status}`);
            }
    
            setTasks(tasks.filter(task => task.id !== taskId));
        } catch (error) {
            console.error('Error in handleDeleteTask:', error);
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

    // submit
    const [snackbarOpen, setSnackbarOpen] = useState(false); // State to control Snackbar
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setIsLoading(true); // Start loading

        console.log(selectedLocationId)
        const formData = new FormData();
        if (selectedDate) {
            formData.append('date', selectedDate.toISOString());
        } else {
            // Handle the case where selectedDate is null
            console.error('Date is not selected');
        }
        if (selectedLocationId !== null) {
            formData.append('location_id', selectedLocationId.toString());
        }
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
            const response = await fetch(`${process.env.REACT_APP_SERVER_API_URL}/api/area-tracker-raw`, {
                method: 'POST',
                body: formData, // FormData is used for file upload
            });
            setIsLoading(false); // End loading
            setSnackbarOpen(true);
    
            
        } catch (error) {
            console.error('Error submitting walkthrough form:', error);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false); // Close the Snackbar
    };


    return (
        <Container maxWidth="md" sx={{ marginTop: 4 }}>
            <Typography variant="h3" gutterBottom component="div">
                Garden Walkthrough
            </Typography>
            <Typography variant="subtitle1" gutterBottom component="div">
                Follow the steps to record your observations for each area and bed in the garden.
            </Typography>
            <input type="date" value={selectedDate?.toISOString().substr(0, 10)} onChange={handleDateChange} />
    
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
                        <MenuItem value="All Beds">All Beds</MenuItem>
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
    
            
            <div>
                {isLoading ? (
                <CircularProgress />
                ) : (
                    <Button type="submit" variant="contained" color="primary" sx={{ marginTop: 0 }}>
                        {currentLocationIndex < gardenLocations.length - 1 ? 'Submit' : 'Submit'}
                    </Button>
                )}
            </div>
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
                    {selectedBed === "All Beds" && <TableCell><b>Bed</b></TableCell>}
                    <TableCell><b>Plant Name</b></TableCell>
                    <TableCell><b>Notes </b>(editable)</TableCell>
                    <TableCell><b>Status</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                    {plantSnapshots.map((snapshot) => (
                        <TableRow key={snapshot.id}>
                            {selectedBed === 'All Beds' && <TableCell>{snapshot.bed}</TableCell>}
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
                        {selectedBed === "All Beds" && <TableCell><b>Bed</b></TableCell>}
                        <TableCell><b>Task</b> (editable)</TableCell>
                        <TableCell><b>Status</b></TableCell>
                            {displayColumns.assignee && <TableCell><b>Assignee</b></TableCell>}
                            {displayColumns.dueDate && <TableCell><b>Due Date</b></TableCell>}
                            {displayColumns.priority && <TableCell><b>Priority</b></TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tasks.map((task) => (
                    <TableRow key={task.id}>
                        {selectedBed === 'All Beds' && <TableCell>{task.bed}</TableCell>}
                        <TableCell onDoubleClick={() => handleEditStart(task.id, 'task_description', task.task_description)}>
                            {editableCell.rowId === task.id && editableCell.column === 'task_description' ? (
                                <TextField
                                    value={editableValue}
                                    onChange={(e) => setEditableValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                    fullWidth
                                />
                            ) : (
                                task.task_description
                            )}
                        </TableCell>
                        <TableCell style={{ fontWeight: task.status === 'completed' ? 'bold' : 'normal', color: task.status === 'completed' ? 'green' : 'black' }}>
                        {task.status}
                        </TableCell>
                        {displayColumns.assignee && <TableCell>{task.assignee || '-'}</TableCell>}
                        {displayColumns.dueDate && <TableCell>{task.due_date || '-'}</TableCell>}
                        {displayColumns.priority && <TableCell>{task.priority || '-'}</TableCell>}
                        <TableCell>
                            <IconButton 
                                aria-label="delete" 
                                color="secondary" 
                                onClick={() => handleDeleteTask(task.id)}
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