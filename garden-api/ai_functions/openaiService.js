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
async function processGardenNotesWithAI(record) {
    console.log("Processing garden notes with AI for record:", record.notes);

    // Tool definition for processing garden notes
    const tools = [
        {
            "type": "function",
            "function": {
                "name": "process_garden_notes",
                "description": "A function that takes garden notes and returns structured data about plants in a JSON list. plant_name is the singular common plant name (e.g. tomato, not tomatoes and not tomato seeds). action_category is enum [observation or task (requires FUTURE action by some human)]. Notes summarizes notes from the record",
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
                                "location_id": {"type": "string", "description": "ID of the location where the plant is located. '' if not specified"}
                                },
                            "required": ["plant_name", "action_category", "notes", "location_id"]
                            }
                        },
                    "required": ["plantList"] 
                }
            }
        }
    ];
    const location_table = await getGardenLocations();
    //id, area, bed

    // Messages to instruct the model
    const messages = [
        {"role": "system", "content": "Analyze the garden notes and return a JSON list of objects, each object representing a different plant mentioned in the notes. Each object should populate fields: plant_name [singular common lower case plant name], action_category [enum: task (requires future action by some human), observation (happened in past or user predicts)], notes [describing task or observation], and location_id [if a location is mentioned for ANY plant in the notes use the location for ALL plants unless there are multiple locations specified. Use a liberal fuzzy match the location_table provided for reference]. If there's only one plant mentioned, return a list with a single object." },
        {'role': 'user', 'content': `location_table: ${JSON.stringify(location_table)}, Garden notes: ${record.notes}`},
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
                                "location_id": {"type": "string", "description": "ID of the location where the plant is located. '' if not specified"}
                            },
                            "required": ["plant_name", "plant_status", "notes", "location_id"]
                        }
                    },
                    "required": ["updatedSnapshot"]
                }
            }}];

    // Messages to instruct the model
    const messages = [
        {
            "role": "system", 
            "content": "Process the plant tracker data and existing snapshot in the batch using the update_plant_snapshot tool. Provide an updated snapshot for each plant considering the new plant information, the old entry, and any updated plants in JSON format, including information that would be most relevant to the garden (DO NOT include the name or location of the plant in these notes). Each object should contain the fields plant_name, plant_status, notes, and location_id."
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


module.exports = { queryOpenAI, processTaskListWithAI, processGardenNotesWithAI, processPlantTrackerToPlantSnapshotAI };

