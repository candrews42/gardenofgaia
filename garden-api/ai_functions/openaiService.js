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

module.exports = { queryOpenAI };
