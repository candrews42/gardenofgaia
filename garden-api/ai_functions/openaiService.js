require('dotenv').config({ path: '../.env' });
const { OpenAI } = require('openai');
const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });

const openai_model_options = ["gpt-3.5-turbo-1106", "gpt-4-1106-preview"]
const openai_model = openai_model_options[1]
const { getGardenLocations } = require('./dbService'); 


async function queryOpenAI(prompt) {
    const response = await openai.chat.completions.create({
        model: openai_model,
        messages: [{ role: 'system', content: prompt }],
        stream: false
    });
    if (response.choices && response.choices.length > 0 && response.choices[0].message) {
        return response.choices[0].message.content;
    }
    return null;
}

// Process garden notes using AI
async function processLocationsWithAI(record, plantInfo) {
    console.log("Processing garden notes for locations with AI for record:", record);

    // Fetch garden locations table
    const location_table = await getGardenLocations();
    // id, area, bed

    // Tool definition for processing garden notes
    const tools = [
        {
            "type": "function",
            "function": {
                "name": "process_garden_locations",
                "description": "A function that takes garden notes and location_table, then searches the garden notes for any areas and locations that have a fuzzy match to the location_table. It return EXACTLY: area_name (if there is a fuzzy match, otherwise ''), area_id (related to area_name, otherwise ''), location_name (if there is a fuzzy match within area_name, otherwise ''), and location_id (related to area_name and location_name, otherwise '').",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "locationsList": {
                            "type": "array",
                            "description": "A list of plants and their location information",
                            "items":{
                                "area_name": {"type": "string", "description": "Name of the area where the plant is located. '' if not specified"},
                                "area_id": {"type": "int", "description": "area id as a NUMBER"},
                                "location_name": {"type": "string", "description": "Name of the location where the plant is located. '' if not specified"},
                                "location_id": {"type": "int", "description": "location id as a NUMBER"},
                                },
                            "required": ["area_name", "area_id", "location_name", "location_id"]
                            }
                        },
                    "required": ["locationsList"] 
                }
            }
        }
    ];

    // Messages to instruct the model
    const messages = [
        // Instruction for AI to process garden notes
        {"role": "system", "content": `Find any areas or locations mentioned in the garden notes. Then, search for the area_name, area_id, location_name, and location_id from the location_table, and return a JSON list of objects with these fileds. Please use a liberal fuzzy match for location. Return a JSON list of objects, even if one object only. Example input: "the tomatoes in sunken garden 1 are fruiting", Example output: { area_name: 'sunken garden', area_id: '27', 'location_name: 'bed 1', location_id: 49 }`},
        {'role': 'user', 'content': `location_table: ${JSON.stringify(location_table)}, Garden Notes: ${JSON.stringify(record)}`}]
                
        console.log("Sending the following record notes to OpenAI for processing:", messages);

    try {
        // Making the API call with structured data
        const response = await openai.chat.completions.create({
            model: openai_model,
            messages: messages,
            tools: tools,
            tool_choice: {"type": "function", "function": {"name": "process_garden_locations"}},
            response_format: {type: "json_object"}
        }); 

        // Parse the response to get plant list
        const message = response.choices[0].message.tool_calls[0].function.arguments;
        const parsedContent = JSON.parse(message).locationsList;
        console.log("received from OpenAI: ", parsedContent)
        return parsedContent

    } catch (error) {
        console.error('Error in processGardenNotesWithAI:', error);
    }

    return null;
}

// Process garden notes using AI
async function processGardenNotesWithAI(record, location_table) {
    console.log("Processing garden notes with AI for record:", record.notes);

    // Tool definition for processing garden notes
    const tools = [
        {
            "type": "function",
            "function": {
                "name": "process_garden_notes",
                "description": "A function that takes garden notes and returns structured data about plants in a JSON list. plant_name is the singular common plant name (e.g. tomato, not tomatoes and not tomato seeds). action_category is enum [observation or task (requires FUTURE action by some human)]. Notes summarizes notes relevant to the plant from the record. area_id and location_id are referenced from the location table",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "plantList": {
                            "type": "array",
                            "description": "A list of plants and info extracted from garden notes.",
                            "items":{
                                "plant_name": {"type": "string", "description": "Name of the plant"},
                                "action_category": {"type": "string", "enum": ["observation", "task"], "description": "Category of the action"},
                                "notes": {"type": "string", "description": "Summary of the notes related to the specific plant"},
                                "area_id": {"type": "string", "description": "the area_id where the plant is located. null if not specified"},
                                "location_id": {"type": "string", "description": "the location_id where the plant is located. null if not specified"}
                                },
                            "required": ["plant_name", "action_category", "notes", "area_id", "location_id"]
                            }
                        },
                    "required": ["plantList"] 
                }
            }
        }
    ];

    // Messages to instruct the model
    const messages = [
        {"role": "system", "content": "Analyze the garden notes and return a JSON list of objects, each object representing a different plant mentioned in the notes. Each object should populate fields: plant_name [singular common lower case plant name], action_category [enum: task (requires future action by some human), observation (happened in past or user predicts)], notes [describing task or observation], area_id and location_id from the location table. If there's only one plant mentioned, return a list with a single object." },
        {'role': 'user', 'content': `Garden notes: ${record.notes}, location_table: ${JSON.stringify(location_table)}`},
    ];

    console.log("Sending the following record notes to OpenAI for processing:", messages);

    try {
        // Making the API call with the structured tool
        const response = await openai.chat.completions.create({
            model: openai_model,
            messages: messages,
            tools: tools,
            // tool_choice: "auto"
            tool_choice: {"type": "function", "function": {"name": "process_garden_notes"}},
            response_format: {type: "json_object"}
        }); 
        // console.log("Received response from OpenAI:", response);

        // Parsing the function call object
        const message = response.choices[0].message.tool_calls[0].function.arguments;
        const parsedContent = JSON.parse(message).plantList;
        console.log("received from OpenAI: ", parsedContent)
        return parsedContent

    } catch (error) {
        console.error('Error in processGardenNotesWithAI:', error);
    }

    return null;
}

async function processPlantTrackerToPlantSnapshotAI(existingSnapshots) {
    // Define the tool for processing plant tracker data
    const tools = [
        {
            "type": "function",
            "function": {
                "name": "update_plant_snapshot",
                "description": "A function that processes plant tracker data and provides instructions for updating plant snapshot. Each includes plant_name, plant_status (healthy, fruiting, sick, etc.), and notes (relevant to the gardener to care for the plant on their rounds).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "updatedSnapshot": {
                            "type": "array",
                            "description": "A list of the updated snapshots of the plants.",
                            "items": {
                                "plant_name": {"type": "string"},
                                "plant_status": {"type": "string", "description": "something like healthy, fruiting, sick, etc."},
                                "notes": {"type": "string", "description": "any notes relevant to the gardener to care for the plant"},
                                "area_id": {"type": "string", "description": "ID # of the area where the plant is located. '' if not specified"},
                                "location_id": {"type": "string", "description": "ID # of the location where the plant is located. '' if not specified"}
                            },
                            "required": ["plant_name", "plant_status", "notes", "area_id", "location_id"]
                        }
                    },
                    "required": ["updatedSnapshot"]
                }
            }}];

    // Messages to instruct the model
    const messages = [
        {
            "role": "system", 
            "content": "Process the plant tracker data and existing snapshot in the batch using the update_plant_snapshot tool. Provide an updated snapshot for each plant considering the new plant information, the old entry, and any updated plants in JSON format, including information that would be most relevant to the garden (DO NOT include the name or location of the plant in these notes). Each object should contain the fields plant_name, plant_status, notes, area_id, and location_id."
        },
        {
            'role': 'user', 
            'content': `New Plant info and existing snapshots: ${JSON.stringify(existingSnapshots)}`
        }
    ];
    
    console.log("Sending to OpenAI for processing into plant_snapshot:", messages);

    try {
        // Making the API call with the structured tool
        const response = await openai.chat.completions.create({
            model: openai_model,
            messages: messages,
            tools: tools,
            // tool_choice: "auto"
            tool_choice: {"type": "function", "function": {"name": "update_plant_snapshot"}},
            response_format: {type: "json_object"}
        });
        // console.log("Received response from OpenAI:", response);

        // Parsing the function call object
        const message = response.choices[0].message.tool_calls[0].function.arguments;
        const parsedContent = JSON.parse(message).updatedSnapshot;
        console.log("received from OpenAI: ", parsedContent)
        return parsedContent

    } catch (error) {
        console.error('Error in processGardenNotesWithAI:', error);
    }

    return null;
}

// TASK MANAGEMENT
async function processTaskListWithAI(record, existingTasks) {
    // Define the tool for processing task manager data
    const tools = [
        {
            "type": "function",
            "function": {
                "name": "update_task_manager",
                "description": "A function that processes record notes and extracts tasks, including updating existing tasks. Each task includes a task ID (if it exists), task_description and status, and (if the info is there) due date, status, assignee, priority. Use the properties in parameters. Do NOT return location_id",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "updatedTasks": {
                            "type": "array",
                            "description": "A list of tasks with updated information.",
                            "items": {
                                "id": {"type": "string", "description": "unique identifier for the task, if it exists"},
                                "task_description": {"type": "string"},
                                "status": {"type": "string", "description": "ENUM waiting, assigned, complete"},
                                "assignee": {"type": "string", "description": "who the task is assigned to"},
                                "due_date": {"type": "string", "description": "date the task is due"}
                            },
                            "required": ["task_description", "status"]
                        }
                    },
                    "required": ["updatedTasks"]
                }
            }
        }
    ];

    // Messages to instruct the model
    const messages = [
        {
            "role": "system", 
            "content": "Extract tasks from the record notes and provide details in JSON format, including at least task description and status, with any other relevant details, and the task ID if updating an existing task"
        },
        {
            'role': 'user', 
            'content': `Record notes: ${JSON.stringify(record.notes)}; existing tasks: ${JSON.stringify(existingTasks)}`
        }
    ];
    
    console.log("Sending to OpenAI for processing tasks:", messages);

    try {
        // Making the API call with the structured tool
        const response = await openai.chat.completions.create({
            model: openai_model,
            messages: messages,
            tools: tools,
            tool_choice: {"type": "function", "function": {"name": "update_task_manager"}},
            response_format: {type: "json_object"}
        });

        // Parsing the function call object
        const message = response.choices[0].message.tool_calls[0].function.arguments;
        const parsedContent = JSON.parse(message).updatedTasks;
        return parsedContent

    } catch (error) {
        console.error('Error in processTaskListWithAI:', error);
    }

}


module.exports = { queryOpenAI, processLocationsWithAI, processTaskListWithAI, processGardenNotesWithAI, processPlantTrackerToPlantSnapshotAI };

