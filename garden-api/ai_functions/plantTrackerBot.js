const db = require('../db');
require('dotenv').config({ path: '../.env' });
const { OpenAI } = require('openai');
const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });

async function processGardenNotes(record) {
    console.log("Starting to process garden note for record id:", record.id);
    try {
        // STEP 1. Parse observation and add to plant_tracker
        console.log(`Processing record notes: ${record.notes}`);
        const prompt = `From these garden notes: "${record.notes}", create a JSON list of objects using EXACTLY the structure below and ensure all fields are accurately filled. Respond ONLY AND EXACTLY in a JSON list of objects as shown below (notes to you in []), which will be fed into a program that receives this structure and will break otherwise. Here is the contents of one record for the JSON structure:
        {'date': '${record.date}', 'location_id': '${record.location_id}', 'plant_name': [extract the name of the plant], 'action_category': exactly one of ['observation', 'task', or 'event'], 'notes': [Extract and summarize the record notes related only to that specific plant.]}`;    

        console.log('Prompt: ', prompt);
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'system', content: prompt }],
            stream: false
        });
        let plantInfos, plantInfo

        if (response.choices && response.choices.length > 0 && response.choices[0].message) {
            const messageContent = response.choices[0].message.content;
            console.log("Received response from OpenAI:", messageContent);

            console.log()
            plantInfos = JSON.parse(messageContent);
            console.log("plant info: ", plantInfo)

            for (plantInfo of plantInfos) {
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
        for (plantInfo of plantInfos) {
            // Query to check if a snapshot already exists
            console.log("Checking for existing plant snapshot for", plantInfo.plant_name);
            const snapshotQuery = 'SELECT id FROM plant_snapshot WHERE plant_name = $1 AND location_id = $2';
            const snapshotResult = await db.query(snapshotQuery, [plantInfo.plant_name, record.location_id]);
            console.log("existing snapshot:", snapshotResult)

            let snapshotId;

            // check if there is an existing snapshot
            if (snapshotResult.rowCount > 0) {
                console.log("Existing snapshot found for ", plantInfo.plant_name, "... preparing to update...");
                // analyze plant snapshot for any updates
                const existingSnapshot = snapshotResult.rows.length > 0 ? snapshotResult.rows[0] : null;

                const updatePrompt = `Given the current snapshot: "${JSON.stringify(existingSnapshot)}" and the new plant information: "${JSON.stringify(plantInfo)}", create a JSON object using EXACTLY the structure below and ensure all fields are accurately filled. Respond ONLY AND EXACTLY with the following structure:

                {'updated_date': '${new Date().toISOString()}', 'location_id': '${existingSnapshot ? existingSnapshot.location_id : record.location_id}', 'plant_name': '${existingSnapshot ? existingSnapshot.plant_name : plantInfo.plant_name}', 'plant_status': [insert updated plant status], 'notes': [insert updated notes]}.`;
                console.log('AI Update Prompt:', updatePrompt);

                const updateResponse = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'system', content: updatePrompt }],
                    stream: false
                });

                if (updateResponse.choices && updateResponse.choices.length > 0 && updateResponse.choices[0].message) {
                    const updatedSnapshotContent = updateResponse.choices[0].message.content;
                    console.log("AI Update Response:", updatedSnapshotContent);
                    // Ensure to replace single quotes with double quotes for JSON parsing
                    const validJsonContent = updatedSnapshotContent.replace(/'/g, '"');
                    const updatedSnapshot = JSON.parse(validJsonContent);

                    // Update the existing snapshot
                    snapshotId = snapshotResult.rows[0].id;
                    const updateQuery = 'UPDATE plant_snapshot SET updated_date = CURRENT_DATE, plant_status = $1, notes = $2 WHERE id = $3';
                    await db.query(updateQuery, [plantInfo.plant_status, plantInfo.notes, snapshotId]);
                    console.log(`Snapshot updated.`);
                }
            } else {
                console.log("No existing snapshot, inserting new snapshot...");
                // Insert a new snapshot
                const insertQuery = 'INSERT INTO plant_snapshot (updated_date, location_id, plant_name, plant_status, notes) VALUES (CURRENT_DATE, $1, $2, $3, $4) RETURNING id';
                const newSnapshot = await db.query(insertQuery, [record.location_id, plantInfo.plant_name, plantInfo.plant_status, plantInfo.notes]);
                snapshotId = newSnapshot.rows[0].id;
                console.log(`New snapshot inserted with id: ${snapshotId}.`);
            }

            // Now snapshotId contains the ID of the relevant snapshot, which can be used for further operations like linking tasks.
        }
        console.log("Finished processing all garden notes.");
    } catch (error) {
        console.error('Error processing garden notes:', record.id, error);
    }
}

module.exports = { processGardenNotes };

