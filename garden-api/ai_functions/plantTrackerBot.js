const db = require('../db');
require('dotenv').config({ path: '../.env' });
const { OpenAI } = require('openai');
const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });
const { queryOpenAI, processGardenNotesWithAI, processPlantTrackerToPlantSnapshotAI } = require('./openaiService'); 
const { insertPlantTracker, getExistingPlantSnapshots, insertPlantSnapshot } = require('./dbService'); 

async function processGardenNotes(record) {
    try {
        // STEP 1. Parse observation and add to plant_tracker
        console.log(`Processing record: ${record.notes}`);
        // Call the new function to process garden notes
        const plantInfos = await processGardenNotesWithAI(record);
        
        await insertPlantTracker(plantInfos);
        // data added to plant_tracker            
        return plantInfos
    } catch (error) {
        console.error('Error processing garden notes:', record.id, error);
    }
}

async function processPlantTrackerForSnapshot(record, plantInfos) {
    try {
        // STEP 1. Parse observation and add to plant_tracker
        console.log(`Processing record for snapshot: ${plantInfos}`);

        // get any existing snapshots: 
        const existingSnapshots = await getExistingPlantSnapshots(plantInfos);
        console.log("existing snapshots: ", existingSnapshots)

        // Call the new function to process garden notes
        const updatedSnapshots = await processPlantTrackerToPlantSnapshotAI(plantInfos, existingSnapshots);
        
        await insertPlantSnapshot(record, existingSnapshots, updatedSnapshots);
        // data added to plant_tracker            
        return null
    } catch (error) {
        console.error('Error processing garden notes:', record.id, error);
    }
}

module.exports = { processGardenNotes, processPlantTrackerForSnapshot };

