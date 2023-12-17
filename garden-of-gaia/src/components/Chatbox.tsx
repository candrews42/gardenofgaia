// Chatbox.js
import React, { useState, ChangeEventHandler, FormEventHandler } from 'react';
import { Box, TextField, IconButton, Grid, CircularProgress } from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SendIcon from '@mui/icons-material/Send';

// Define a type for the component props
interface ChatboxProps {
    notes: string;
    setNotes: React.Dispatch<React.SetStateAction<string>>;
    handleImageChange: ChangeEventHandler<HTMLInputElement>;
    handleSubmit: FormEventHandler<HTMLFormElement>;
    isLoading: boolean;
}

const Chatbox: React.FC<ChatboxProps> = ({ notes, setNotes, handleImageChange, handleSubmit, isLoading }) => {
    const [rows, setRows] = useState(1);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNotes(event.target.value);

        // Update rows based on the content
        const lineBreaks = (event.target.value.match(/\n/g) || []).length;
        const newRows = Math.min(Math.max(1, lineBreaks + 1), 10); // Set a maximum limit to prevent excessive growth
        setRows(newRows);
    };

    return (
        <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', boxShadow: 3, padding: 2, zIndex: 1000 }}>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={1} alignItems="flex-end">
                    <Grid item xs={10}>
                        <TextField
                            label="Observations"
                            value={notes}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={rows}
                        />
                    </Grid>
                    <Grid item>
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
                    </Grid>
                    <Grid item>
                        <IconButton color="primary" aria-label="send" type="submit" disabled={isLoading}>
                            {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
                        </IconButton>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
};

export default Chatbox;
