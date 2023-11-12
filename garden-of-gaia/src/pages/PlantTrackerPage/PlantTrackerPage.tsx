// src/pages/PlantTrackerPage/PlantTrackerPage.tsx
/// <reference types="@types/googlemaps" />
import React, { useState, useEffect, useCallback } from 'react'; // Import useEffect
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { Loader } from '@googlemaps/js-api-loader'; // Import Loader instead of loadScript
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const containerStyle = {
    width: '400px',
    height: '400px'
  };
  
const center = {
    lat: 26.2235, // Latitude of Bahrain
    lng: 50.5876  // Longitude of Bahrain
  };

interface GardenLocation {
id: number;
area: string;
bed: string;
}

const PlantTrackerPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [location, setLocation] = useState('');
    const [autoFilledLocation, setAutoFilledLocation] = useState(''); // State to hold the autofilled location
    const [plantName, setPlantName] = useState('');
    const [notes, setNotes] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markerPosition, setMarkerPosition] = useState(center);
    const [Area, setArea] = useState([]); // Array of areas
    const [selectedArea, setSelectedArea] = useState(''); // Selected area
    const [Bed, setBed] = useState([]); // Jalwas and beds for selected zone
    const [selectedBed, setSelectedBed] = useState(''); // Selected Jalwa or Bed
    // database connections
    const [gardenLocations, setGardenLocations] = useState<GardenLocation[]>([]);

    // Create a unique list of areas for the Area dropdown
    const uniqueAreas = Array.from(new Set(gardenLocations.map(location => location.area)));
    // When an area is selected, get unique beds for that area
    const bedsForSelectedArea = Array.from(new Set(gardenLocations
        .filter(location => location.area === selectedArea)
        .map(location => location.bed)));
   
    
    useEffect(() => {
    fetch('http://localhost:3001/api/garden-locations')
        .then(response => response.json())
        .then((data: GardenLocation[]) => setGardenLocations(data))
        .catch(error => console.error('Error fetching garden locations:', error));
    }, []);
  
    // get the current location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
        setAutoFilledLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
        }, (error) => {
        console.error('Error obtaining location', error);
        });
    }, []);

    // change the image
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        setImage(event.target.files[0]);
    }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            // Replace 'plant_id' with actual plant id value
            const plant_id = 1; // TODO using "Other" entry, replace with actual logic to get plant ID
            // Find the selected location's ID
            const selectedLocation = gardenLocations.find(location => location.area === selectedArea && location.bed === selectedBed);
            if (!selectedLocation) {
                console.error('Selected location not found');
                return;
            }
            // fill out form data
            const formData = { 
                date: new Date().toISOString().slice(0, 10), // current date
                location: selectedLocation.id, // Concatenating area and bed for location
                plant_id, 
                action: 'observation', // TODO Example action, replace with actual value
                notes,
                picture: '', // TODO Handle picture logic as required
            };

            await fetch('http://localhost:3001/api/plant-tracker', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            // Additional logic after successful submission (e.g., show message, clear form)
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    return (
    <div>
        <h1>Plant Tracker</h1>
        <form onSubmit={handleSubmit}>
        <TextField
            label="User"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            fullWidth
        />
        <TextField
            label="Plant Name"
            value={plantName}
            onChange={(e) => setPlantName(e.target.value)}
            margin="normal"
            fullWidth
        />
        {/* TODO add helper text to the notes, to guide the user.
            1. give these bullets to chatgpt, ask it for the best help text to provide in this box:
                * is the plant fruiting? does it look sick?
                * what's happening in the surrounding area? Any other plants? any human activity?
            2. copy this entire code and ask chatgpt to add the helper text to the text box below. Find the difference and paste it in.
        */}
        <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            margin="normal"
            fullWidth
            multiline
            rows={4} // You can adjust the number of rows
        />
        <TextField
            label="Your Current Location (if authorized)"
            value={autoFilledLocation}
            margin="normal"
            fullWidth
            InputProps={{
              readOnly: true,
            }}
        />
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
        {/* Image upload input */}
        <input
            accept="image/*"
            style={{ display: 'none' }}
            id="icon-button-file"
            type="file"
            onChange={handleImageChange}
            capture="environment" // This attribute enables capturing images directly from a camera
        />
        <label htmlFor="icon-button-file">
            <IconButton color="primary" aria-label="upload picture" component="span">
            <PhotoCamera />
            </IconButton>
        </label>
        {image && <p>Image selected: {image.name}</p>}
        {/* Submit Button */}
        <br />
        <Button type="submit" variant="contained" color="primary">
            Submit
        </Button>
        </form>
    </div>
    );
};

export default PlantTrackerPage;
