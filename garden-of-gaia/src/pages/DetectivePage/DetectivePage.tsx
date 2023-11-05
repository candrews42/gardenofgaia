// src/pages/DetectivePage/DetectivePage.tsx

import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

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
