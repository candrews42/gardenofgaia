



// File: garden-api/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path')

const app = express();
app.use(cors());
app.use(express.json());

// for serving the frontend's static assets
app.use(express.static(path.join(__dirname, "./build")))

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const pool = require('./db'); // Adjust the path to your db.js file

// Route to get garden-locations table
app.get('/api/garden-locations', async (req, res) => {
    try {
      const locations = await pool.query('SELECT * FROM garden_locations');
      res.json(locations.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

// Route to get plants table
app.get('/api/plants', async (req, res) => {
    try {
      const locations = await pool.query('SELECT * FROM plants');
      res.json(locations.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

// Route to get garden-locations table
app.get('/api/garden_locations', async (req, res) => {
    try {
      const locations = await pool.query('SELECT * FROM garden_locations');
      res.json(locations.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

// Route to get plant_tracker table
app.get('/api/plant_tracker', async (req, res) => {
    try {
      const locations = await pool.query('SELECT * FROM plant_tracker');
      res.json(locations.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });


// Route to get all areas
app.get('/api/areas', async (req, res) => {
    try {
        const areas = await pool.query('SELECT * FROM areas');
        res.json(areas.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Route to get all observations from area_tracker_raw
app.get('/api/observations', async (req, res) => {
    try {
        const observations = await pool.query('SELECT * FROM area_tracker_raw');
        res.json(observations.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// get plant snapshot for specific bed
// ... (existing imports and setup)

// Route to get plant_snapshot entries for a specific area and bed
app.get('/api/plant-snapshots', async (req, res) => {
    try {
        const { area_id, bed } = req.query;

        // If no area_id or bed is provided, return all records from the plant_snapshot table
        if (!area_id && !bed) {
            const allSnapshotsResult = await pool.query('SELECT * FROM plant_snapshot');
            return res.json(allSnapshotsResult.rows);
        }
        // Adjust the query to conditionally include the bed in the WHERE clause
        const locationIdQuery = bed 
            ? 'SELECT id, bed FROM garden_locations WHERE area_id = $1 AND bed = $2'
            : 'SELECT id, bed FROM garden_locations WHERE area_id = $1';
        const queryParams = bed ? [area_id, bed] : [area_id];

        const locationResult = await pool.query(locationIdQuery, queryParams);

        if (locationResult.rows.length === 0) {
            return res.status(404).json({ message: 'Location not found' });
        }

        // If bed is not provided, return all plants in the area
        const snapshotsQuery = bed 
            ? 'SELECT * FROM plant_snapshot WHERE location_id = $1'
            : 'SELECT * FROM plant_snapshot WHERE location_id IN (SELECT id FROM garden_locations WHERE area_id = $1)';
        const snapshotsResult = await pool.query(snapshotsQuery, bed ? [locationResult.rows[0].id] : [area_id]);

        // Add bed information to each snapshot
        const snapshotsWithBed = snapshotsResult.rows.map(snapshot => ({
            ...snapshot,
            bed: locationResult.rows.find(location => location.id === snapshot.location_id).bed
        }));

        res.json(snapshotsWithBed);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// route to update notes in plant_snapshot
app.post('/api/update-plant-snapshot-notes', async (req, res) => {
    try {
        const { snapshotId, newNotes } = req.body;

        const updateQuery = 'UPDATE plant_snapshot SET notes = $1 WHERE id = $2 RETURNING *';
        console.log(updateQuery)
        const updateResult = await pool.query(updateQuery, [newNotes, snapshotId]);

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ message: 'Snapshot not found' });
        }

        res.json(updateResult.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// PUT endpoint to update task_description in task_manager
app.put('/api/tasks/:id', async (req, res) => {
    console.log(req.body)
    try {
        const { id } = req.params;
        const { newTaskDescription } = req.body;
        const updateTask = await pool.query(
            'UPDATE task_manager SET task_description = $1 WHERE id = $2 RETURNING *',
            [newTaskDescription, id]
        );
        if (updateTask.rowCount === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(updateTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Route to get task entries for a specific area and bed
app.get('/api/tasks', async (req, res) => {
    try {
        const { area_id, bed } = req.query;

        // Adjust the query to conditionally include the bed in the WHERE clause
        const locationIdQuery = bed 
            ? 'SELECT id, bed FROM garden_locations WHERE area_id = $1 AND bed = $2'
            : 'SELECT id, bed FROM garden_locations WHERE area_id = $1';
        const queryParams = bed ? [area_id, bed] : [area_id];

        const locationResult = await pool.query(locationIdQuery, queryParams);

        if (locationResult.rows.length === 0) {
            return res.status(404).json({ message: 'Location not found' });
        }

        // If bed is not provided, return all tasks in the area
        const tasksQuery = bed 
            ? 'SELECT * FROM task_manager WHERE location_id = $1'
            : 'SELECT * FROM task_manager WHERE location_id IN (SELECT id FROM garden_locations WHERE area_id = $1)';
        const tasksResult = await pool.query(tasksQuery, bed ? [locationResult.rows[0].id] : [area_id]);
        // Add bed information to each task
        
        const tasksWithBed = tasksResult.rows.map(task => ({
            ...task,
            bed: locationResult.rows.find(location => location.id === task.location_id)?.bed
        }));

        res.json(tasksWithBed);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


app.post('/api/plant-tracker', async (req, res) => {
    try {
        const { date, location_id, plant_id, action_category, notes, picture, plant_name, area_id } = req.body;
        const newEntry = await pool.query(
            'INSERT INTO plant_tracker (date, location_id, plant_id, action_category, notes, picture, plant_name, area_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [date, location_id, plant_id, action_category, notes, picture, plant_name, area_id]
        );
        res.json(newEntry.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// DELETE endpoint to delete entry from plant-snapshots
app.delete('/api/plant-snapshots/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM plant_snapshot WHERE id = $1', [id]);
        res.status(200).json({ message: 'Snapshot deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// DELETE endpoint to delete entry from task_manager
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM task_manager WHERE id = $1', [id]);
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// upload to area_tracker_raw
const multer = require('multer');
const sharp = require('sharp');
const upload = multer({ storage: multer.memoryStorage() }); // Store images in memory for processing
const { processTaskList, processGardenNotes, processPlantTrackerForSnapshot } = require('./ai_functions/plantTrackerBot'); // Adjust the path to plantTrackerBot.js

app.post('/api/area-tracker-raw', upload.single('image'), async (req, res) => {
    try {
        //console.log('received:', req.body);
        const { date, area_id, location_id, notes, username, current_location } = req.body;

        // image handling
        let resizedImage;
        if (req.file) {
            // Resize the image to a maximum width of 800 pixels and convert to JPEG
            resizedImage = await sharp(req.file.buffer)
                .resize({ width: 800 })
                .jpeg({ quality: 80 })
                .toBuffer();
        }
        
        // insert raw observations into area_tracker_raw table
        console.log('received:', date, location_id, notes, username, current_location, resizedImage);
        const newEntry = await pool.query(
            'INSERT INTO area_tracker_raw (date, area_id, location_id, notes, username, current_location, image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [date, area_id, location_id, notes, username, current_location, resizedImage]
        );
        // After successful insertion, process the garden notes
        record = newEntry.rows[0];

        // first, extract and update any tasks
        const taskList = await processTaskList(record);

        // process garden notes record into plant_tracker table
        const plantInfos = await processGardenNotes(record);

        // process new plant tracker table entrise to update plant snapshot
        await processPlantTrackerForSnapshot(record, plantInfos);

        res.json({ message: 'databases updated successfully.' });
        
        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// for serving the frontend
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, "build/index.html"))
  });
