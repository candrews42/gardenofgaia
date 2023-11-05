// src/pages/DetectivePage/DetectivePage.tsx

import React, { useState } from 'react';
import { TextField, Button } from '@mui/material'; // Import Button from Material UI

const DetectivePage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [plantName, setPlantName] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log({ username, location, plantName, notes });
  };

  return (
    <div>
      <h1>Detective Page</h1>
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
        <Button type="submit" variant="contained" color="primary">
          Submit
        </Button>
      </form>
    </div>
  );
};

export default DetectivePage;
