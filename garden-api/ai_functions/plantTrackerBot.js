const db = require('../db');
require('dotenv').config({ path: '../.env' });
const { OpenAI } = require('openai');
const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });
const { queryOpenAI, processTaskListWithAI, processGardenNotesWithAI, processPlantTrackerToPlantSnapshotAI } = require('./openaiService'); 
const { getExistingTaskList, updateTaskManager, insertPlantTracker, getExistingPlantSnapshots, updatePlantSnapshot } = require('./dbService'); 

async function processTaskList(record) {
    try {
        // STEP 1. Parse observation and add to plant_tracker
        console.log(`Processing record: ${record.notes}`);

        // get any existing task list: 
        const existingTaskList = await getExistingTaskList(record, filter_by="location_id");
        console.log("existing task list:", existingTaskList)

        // process Task list from garden notes
        const updatedTaskList = await processTaskListWithAI(record, existingTaskList);
        console.log("updated task list:", updatedTaskList)
        
        await updateTaskManager(record, existingTaskList, updatedTaskList);
        // data added to plant_tracker            
        return updatedTaskList
    } catch (error) {
        console.error('Error processing garden notes for task manager:', record.id, error);
    }
}

async function processGardenNotes(record) {
    try {
        // STEP 1. Parse observation and add to plant_tracker
        console.log(`Processing record: ${record.notes}`);
        // Call the new function to process garden notes
        const plantInfos = await processGardenNotesWithAI(record);
        console.log("plant infos:", plantInfos)
        
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
        console.log("--------------------")
        console.log("plant Infos", plantInfos)
        console.log("existing snapshots: ", existingSnapshots)

        // Call the new function to process garden notes
        const updatedSnapshots = await processPlantTrackerToPlantSnapshotAI(existingSnapshots);
        
        await updatePlantSnapshot(record, existingSnapshots, updatedSnapshots);
        // data added to plant_tracker            
        return null
    } catch (error) {
        console.error('Error processing garden notes:', record.id, error);
    }
}

module.exports = { processTaskList, processGardenNotes, processPlantTrackerForSnapshot };

