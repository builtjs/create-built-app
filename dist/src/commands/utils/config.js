"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenAIConfig = getOpenAIConfig;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
function getOpenAIConfig() {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4';
    if (!apiKey) {
        throw new Error('OpenAI API key not found in .env file');
    }
    return { apiKey, model };
}
