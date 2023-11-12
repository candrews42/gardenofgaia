// src/pages/DetectivePage/DetectivePage.tsx
/// <reference types="@types/googlemaps" />
import React, { useState, useEffect, useCallback } from 'react'; // Import useEffect
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { Loader } from '@googlemaps/js-api-loader'; // Import Loader instead of loadScript
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';


const containerStyle = {
    width: '400px',
    height: '400px'
  };
  
const center = {
    lat: 26.2235, // Latitude of Bahrain
    lng: 50.5876  // Longitude of Bahrain
  };

const DetectivePage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [location, setLocation] = useState('');
    const [autoFilledLocation, setAutoFilledLocation] = useState(''); // State to hold the autofilled location
    const [plantName, setPlantName] = useState('');
    const [notes, setNotes] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markerPosition, setMarkerPosition] = useState(center);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''
    });

    const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    const marker = new google.maps.Marker({
        position: center,
        map: map,
        draggable: true // Make the marker draggable
    });
    
    // Add listener for the marker's drag end event
    google.maps.event.addListener(marker, 'dragend', (event: google.maps.MouseEvent) => {
        onMarkerDragEnd(event);
    });
    
    // Set the marker's position as the initial state
    setMarkerPosition(center);
    
    }, []);
    
    const onMarkerDragEnd = (event: google.maps.MouseEvent) => {
        const newPos = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        setMarkerPosition(newPos);
        // Set the location in an object format similar to the example you provided.
        setLocation(`Lat: ${newPos.lat}, Lng: ${newPos.lng}`);
    };
  

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log({ username, location: autoFilledLocation, plantName, notes, image }); // Use autoFilledLocation here
    };    

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        setImage(event.target.files[0]);
    }
    };

    // Add useEffect to get the current location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
        setAutoFilledLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
        }, (error) => {
        console.error('Error obtaining location', error);
        });
    }, []);
    

    useEffect(() => {
    // Use Loader to load the Google Maps script
    const loader = new Loader({
        apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY as string, // Cast to string
        version: "weekly",
        libraries: ["places"]
    });

    loader.load().then(() => {
        initializeAutocomplete();
        }).catch(e => console.error('Error loading Google Maps', e));
    }, []);

    const initializeAutocomplete = () => {
    // Ensure the google object is available
    if (typeof google === 'undefined') {
        console.error('Google has not been loaded');
        return;
    }

    const input = document.getElementById('autocomplete') as HTMLInputElement;
    const autocomplete = new google.maps.places.Autocomplete(input, { types: ['geocode'] });
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        setLocation(place.formatted_address || ''); // Fallback to empty string if undefined
    });
    };


    return (
    <div>
        <h1>Plant Detective</h1>
        <form onSubmit={handleSubmit}>
        <TextField
            label="Username"
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
            id="autocomplete"
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            margin="normal"
            fullWidth
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
        {isLoaded ? (
            <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={10}
            onLoad={onMapLoad}
            >
            {/* Child components, such as markers, info windows, etc. */}
            <Marker
                position={markerPosition}
                onDragEnd={onMarkerDragEnd}
                draggable={true}
            />
            </GoogleMap>
        ) : <div>Loading...</div>}
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

export default DetectivePage;
