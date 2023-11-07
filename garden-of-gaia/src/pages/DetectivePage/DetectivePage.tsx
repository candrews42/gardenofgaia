// src/pages/DetectivePage/DetectivePage.tsx
/// <reference types="@types/googlemaps" />
import React, { useState, useEffect } from 'react'; // Import useEffect
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { Loader } from '@googlemaps/js-api-loader'; // Import Loader instead of loadScript


const DetectivePage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [plantName, setPlantName] = useState('');
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log({ username, location, plantName, notes, image });
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
    }
  };

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
            id="autocomplete"
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
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
