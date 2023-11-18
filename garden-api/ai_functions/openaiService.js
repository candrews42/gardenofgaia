const db = require('../db');
require('dotenv').config({ path: '../.env' });
const { OpenAI } = require('openai');
const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });

async function queryOpenAI(prompt) {
    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: prompt }],
        stream: false
    });
    if (response.choices && response.choices.length > 0 && response.choices[0].message) {
        return response.choices[0].message.content;
    }
    return null;
}

// Process garden notes using AI
async function processGardenNotesWithAI(record) {
    console.log("Processing garden notes with AI for record:", record.notes);

    // Tool definition for processing garden notes
    const tools = [
        {
            "type": "function",
            "function": {
                "name": "process_garden_notes",
                "description": "A function that takes garden notes and returns structured data about plants in a JSON list. plant_name is the plant name. action_category is enum [observation, task, or event]. Notes should be summarized notes from the record",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "plantList": {
                            "type": "array",
                            "description": "A list of plants and info extracted from garden notes.",
                            "items":{
                                "date": {"type": "string", "description": "Date of the garden note"},
                                "location_id": {"type": "string", "description": "Location identifier"},
                                "plant_name": {"type": "string", "description": "Name of the plant"},
                                "action_category": {"type": "string", "enum": ["observation", "task", "event"], "description": "Category of the action"},
                                "notes": {"type": "string", "description": "Summary of the notes related to the specific plant"}
                                }
                            }
                        },
                    "required": ["plantList"] //, "location_id", "plant_name", "action_category", "notes"]
                }
            }
        }
    ];

    // Messages to instruct the model
    const messages = [
        {"role": "system", "content": "Analyze the garden notes and return a JSON list of objects, each object representing a different plant mentioned in the notes. Each object should contain fields: date, location_id, plant_name, action_category, and notes. If there's only one plant mentioned, return a list with a single object." },
        {'role': 'user', 'content': `Garden notes: ${record.notes}`}
    ];


    console.log("Sending the following messages to OpenAI:", messages);

    try {
        // Making the API call with the structured tool
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            tools: tools,
            tool_choice: "auto"
        });
        // console.log("Received response from OpenAI:", response);

        // Parsing the function call object
        if (response.choices && response.choices.length > 0) {
            const messageObject = response.choices[0].message;

            if (messageObject && messageObject.tool_calls && messageObject.tool_calls.length > 0) {
                const functionCall = messageObject.tool_calls[0];
                // console.log("Function call object:", functionCall);

                if (functionCall.function && functionCall.function.arguments) {
                    const argumentsString = functionCall.function.arguments;
                    // console.log("Arguments string:", argumentsString);
                    
                    // Parse the stringified JSON
                    const parsedContent = JSON.parse(argumentsString);
                    console.log("Parsed response:", parsedContent);

                    // Extract and return the plantList
                    return parsedContent.plantList;
                } else {
                    console.log("No arguments in the function call object");
                }
            } else {
                console.log("No tool_calls in the message object");
            }
        } else {
            console.log("No valid choices in the response");
        }

    } catch (error) {
        console.error('Error in processGardenNotesWithAI:', error);
    }

    return null;
}

async function processPlantTrackerToPlantSnapshot(batchUpdates, record) {
    // Define the tool for processing plant tracker data
    const tools = [
        {
            "type": "function",
            "function": {
                "name": "update_plant_snapshot",
                "description": "A function that processes plant tracker data and provides instructions for updating plant snapshot. Each includes id (taken from old snapshot), location_id (taken from old snapshot), plant_name, plant_status, and notes.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "updatedSnapshot": {
                            "type": "array",
                            "description": "A list of the updated snapshots of the plants.",
                            "items": {
                                "id": {"type": "string"},
                                "location_id": {"type": "string"},
                                "plant_name": {"type": "string"},
                                "plant_status": {"type": "string"},
                                "notes": {"type": "string"}
                            }
                        }
                    },
                    "required": ["updatedSnapshot"]
                }
            }}];

    // Messages to instruct the model
    const messages = [
        {"role": "system", "content": "Based on the provided plant tracker data and current plant snapshot, provide the updated plant snapshot." },
        {'role': 'user', 'content': `${JSON.stringify(batchUpdates)}`}]
    console.log(messages)

    try {
        // API call with structured tool
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            tools: tools,
            tool_choice: "auto"
        });

        // Process response to extract instructions
        if (response.choices && response.choices.length > 0) {
            const messageObject = response.choices[0].message;
            if (messageObject && messageObject.tool_calls && messageObject.tool_calls.length > 0) {
                const functionCall = messageObject.tool_calls[0];
                if (functionCall.function && functionCall.function.arguments) {
                    const updatedSnapshot = JSON.parse(functionCall.function.arguments);
                    return updatedSnapshot
                }}}
    } catch (error) {
        console.error('Error in processPlantTrackerToPlantSnapshot:', error);
    }
    return null
}


module.exports = { queryOpenAI, processGardenNotesWithAI, processPlantTrackerToPlantSnapshot };

