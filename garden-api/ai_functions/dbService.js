const db = require('../db');
require('dotenv').config({ path: '../.env' });

async function insertPlantTracker(plantInfos) {
    for (const plantInfo of plantInfos) {
        console.log("plant info:", plantInfo)
        // Database operations for each plant
        await db.query(
            'INSERT INTO plant_tracker (date, location_id, plant_name, action_category, notes, picture) VALUES ($1, $2, $3, $4, $5, $6)', 
            [record.date, record.location_id, plantInfo.plant_name, plantInfo.action_category, plantInfo.notes, record.id]
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
            const snapshotResult = await db.query(snapshotQuery, [plantInfo.plant_name, record.location_id]);
            const existingSnapshot = snapshotResult.rowCount > 0 ? snapshotResult.rows[0] : null;
            console.log("existing snap:", existingSnapshot)

            batchUpdates.push({ plantInfo, existingSnapshot });
        }
    return batchUpdates;
}

async function insertPlantSnapshot(record, existingSnapshots, updatedSnapshots) {    
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
            await db.query(insertQuery, [record.date, record.location_id, updatedSnapshot.plant_name, updatedSnapshot.plant_status, updatedSnapshot.notes]);
        }
    }
    
    console.log(`All info processed and inserted into plant_tracker`);
    return null
}

module.exports = { insertPlantTracker, insertPlantSnapshot, getExistingPlantSnapshots };
