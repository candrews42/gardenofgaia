const db = require('../db');
require('dotenv').config({ path: '../.env' });

async function getGardenLocations() {
    const gardenLocationsQuery = `SELECT id, area, bed FROM garden_locations`;
    const gardenLocationsResult = await db.query(gardenLocationsQuery);
    const garden_locations = gardenLocationsResult.rowCount > 0 ? gardenLocationsResult.rows : null;
    return garden_locations;
}

async function getExistingTaskList(record, filter_by="location_id") {
    // Validate filter_by to ensure it's a valid column name
    const validFilters = ["location_id", "assignee", "status", "id", "task_description", "due_date", "priority", "added_date"];
    if (!validFilters.includes(filter_by)) {
        throw new Error("Invalid filter field");
    }

    console.log("Checking for existing task list for", filter_by, ":", record[filter_by]);
    const taskListQuery = `SELECT * FROM task_manager WHERE ${filter_by} = $1`;
    const taskListResult = await db.query(taskListQuery, [record[filter_by]]);
    const existingTaskList = taskListResult.rowCount > 0 ? taskListResult.rows : null;
    return existingTaskList;
}

// update Task Manager
async function updateTaskManager(record, existingTaskList, updatedTaskList) {
    console.log("Next, update task_manager table...");

    for (const updatedTask of updatedTaskList) {
        let query, params;

        if (updatedTask.id) {
            // Update existing task
            const fieldsToUpdate = [];
            params = []; // Initialize params as an empty array
        
            // Iterating over key-value pairs
            Object.entries(updatedTask).forEach(([key, value]) => {
                if (key !== 'id' && value !== undefined) {
                    fieldsToUpdate.push(`${key} = $${fieldsToUpdate.length + 1}`);
                    params.push(value);
                }
            });
        
            // Add record.location_id if present
            if (record.location_id !== undefined) {
                fieldsToUpdate.push(`location_id = $${fieldsToUpdate.length + 1}`);
                params.push(record.location_id);
            }
        
            // Construct the query
            query = `UPDATE task_manager SET ${fieldsToUpdate.join(', ')} WHERE id = $${fieldsToUpdate.length + 1}`;
        
            // Add updatedTask.id at the end for the WHERE clause
            params.push(updatedTask.id);
        } else {
            // Insert new task
            const fields = ['task_description', 'status', 'added_date', 'location_id'].filter(field => updatedTask[field] !== undefined || field === 'location_id');
            const values = fields.map((_, index) => `$${index + 1}`);
            query = `INSERT INTO task_manager (${fields.join(', ')}) VALUES (${values.join(', ')}) RETURNING id`;
            params = fields.map(field => updatedTask[field] || (field === 'location_id' ? record.location_id : null));
        }

        // Log the query and params for debugging
        console.log("Executing query:", query);
        console.log("With params:", params);

        try {
            const result = await db.query(query, params);
            if (!updatedTask.id) {
                console.log(`New task added with ID: ${result.rows[0].id}`);
            }
        } catch (error) {
            console.error('Error updating/inserting task:', error);
            break; // Added break to stop further execution on error
        }
    }
    
    console.log(`All tasks processed and updated/inserted into task_manager`);
    return null;
}




async function insertPlantTracker(plantInfos) {
    for (const plantInfo of plantInfos) {
        console.log("plant info:", plantInfo)
        // Database operations for each plant
        await db.query(
            'INSERT INTO plant_tracker (date, location_id, plant_name, action_category, notes, picture) VALUES ($1, $2, $3, $4, $5, $6)', 
            [record.date, plantInfo.location_id, plantInfo.plant_name, plantInfo.action_category, plantInfo.notes, record.id]
        );
        console.log(`Record for ${plantInfo.plant_name} processed and inserted into plant_tracker`);
        }
    
    console.log(`All info processed and inserted into plant_tracker`);
    return null
}

async function getExistingPlantSnapshots(plantInfos) {
    let batchUpdates = [];
        for (const plantInfo of plantInfos) {
            console.log("Checking for existing plant snapshot for", plantInfo.plant_name);
            const snapshotQuery = 'SELECT * FROM plant_snapshot WHERE plant_name = $1 AND location_id = $2';
            const snapshotResult = await db.query(snapshotQuery, [plantInfo.plant_name, plantInfo.location_id]);
            const existingSnapshot = snapshotResult.rowCount > 0 ? snapshotResult.rows[0] : null;
            console.log("existing snap:", existingSnapshot)

            batchUpdates.push({ plantInfo, existingSnapshot });
        }
    return batchUpdates;
}

async function updatePlantSnapshot(record, existingSnapshots, updatedSnapshots) {    
    console.log("updated snapshots:", updatedSnapshots)
    console.log("existing snapshots:", existingSnapshots)
    // STEP 2. Parse plant_tracker and add to plant_snapshot
    console.log("Next, update plant snapshot...")

    for (const updatedSnapshot of updatedSnapshots) {
        // Find the existing snapshot for the current plant
        const existingSnapshot = existingSnapshots.find(snap => snap.plantInfo.plant_name === updatedSnapshot.plant_name);

        if (existingSnapshot && existingSnapshot.existingSnapshot) {
            // Update existing snapshot
            const updateQuery = 'UPDATE plant_snapshot SET updated_date = $1, plant_status = $2, notes = $3 WHERE id = $4';
            await db.query(updateQuery, [record.date, updatedSnapshot.plant_status, updatedSnapshot.notes, existingSnapshot.existingSnapshot.id]);
        } else {
            // Insert new snapshot
            const insertQuery = 'INSERT INTO plant_snapshot (updated_date, location_id, plant_name, plant_status, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id';
            await db.query(insertQuery, [record.date, updatedSnapshot.location_id, updatedSnapshot.plant_name, updatedSnapshot.plant_status, updatedSnapshot.notes]);
        }
    }
    
    console.log(`All info processed and inserted into plant_tracker`);
    return null
}

module.exports = { getGardenLocations, getExistingTaskList, updateTaskManager, insertPlantTracker, updatePlantSnapshot, getExistingPlantSnapshots };
