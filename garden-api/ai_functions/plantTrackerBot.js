const db = require('../db');
require('dotenv').config({ path: '../.env' });
const { OpenAI } = require('openai');
const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });
const { queryOpenAI, processGardenNotesWithAI, processPlantTrackerToPlantSnapshot } = require('./openaiService'); 

async function processGardenNotes(record) {
    try {
        // STEP 1. Parse observation and add to plant_tracker
        console.log(`Processing record: ${record.notes}`);
        // Call the new function to process garden notes
        const plantInfos = await processGardenNotesWithAI(record);
        console.log("plant infos: ", plantInfos)

        if (plantInfos) {
            for (const plantInfo of plantInfos) {
                console.log("plant info:", plantInfo)
                // Database operations for each plant
                await db.query(
                    'INSERT INTO plant_tracker (date, location_id, plant_name, action_category, notes, picture) VALUES ($1, $2, $3, $4, $5, $6)', 
                    [record.date, record.location_id, plantInfo.plant_id, plantInfo.action_category, plantInfo.notes, record.id]
                );
                console.log(`Record for ${plantInfo.plant_name} processed and inserted into plant_tracker`);
                }
            
            console.log(`All info processed and inserted into plant_tracker`);
        } else {
            console.log(`No valid response for record: ${record}`);
        }
        // data added to plant_tracker            
                
        // STEP 2. Parse plant_tracker and add to plant_snapshot
        console.log("Next, update plant snapshot...")
        // Collect all updates
        async function processBatchUpdates(plantInfos, record) {
            let batchUpdates = [];
            for (const plantInfo of plantInfos) {
                console.log("Checking for existing plant snapshot for", plantInfo.plant_name);
                const snapshotQuery = 'SELECT * FROM plant_snapshot WHERE plant_name = $1 AND location_id = $2';
                const snapshotResult = await db.query(snapshotQuery, [plantInfo.plant_name, record.location_id]);
                const existingSnapshot = snapshotResult.rowCount > 0 ? snapshotResult.rows[0] : null;
                console.log("existing snap:", existingSnapshot)

                batchUpdates.push({ plantInfo, existingSnapshot });
            }

            // Process the batch updates
            const updatedSnapshots = await processPlantTrackerToPlantSnapshot(batchUpdates, record);
            console.log("updated snapshots:", updatedSnapshots)

            // Iterate over updatedSnapshots to update or insert into the database
            for (const updatedSnapshot of updatedSnapshots.updatedSnapshot) {
                if (updatedSnapshot.id) {
                    // Update existing snapshot
                    const updateQuery = 'UPDATE plant_snapshot SET updated_date = $1, plant_status = $2, notes = $3 WHERE id = $4';
                    await db.query(updateQuery, [updatedSnapshot.updated_date, updatedSnapshot.plant_status, updatedSnapshot.notes, updatedSnapshot.id]);
                } else {
                    // Insert new snapshot
                    const insertQuery = 'INSERT INTO plant_snapshot (updated_date, location_id, plant_name, plant_status, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id';
                    await db.query(insertQuery, [updatedSnapshot.updated_date, updatedSnapshot.location_id, updatedSnapshot.plant_name, updatedSnapshot.plant_status, updatedSnapshot.notes]);
                }
            }
            console.log("Finished processing all garden notes.");
        }
        await processBatchUpdates(plantInfos, record);

        console.log("Finished processing all garden notes.");
    } catch (error) {
        console.error('Error processing garden notes:', record.id, error);
    }
}

module.exports = { processGardenNotes };

