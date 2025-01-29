"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpenAIClient = createOpenAIClient;
exports.generateComponent = generateComponent;
const openai_1 = __importDefault(require("openai"));
const project_env_1 = require("./project-env");
const prompts_1 = require("./prompts");
const id_1 = require("./id");
const formatting_js_1 = require("./formatting.js");
async function createOpenAIClient(projectRoot) {
    const { apiKey } = await (0, project_env_1.getProjectEnv)(projectRoot);
    return new openai_1.default({ apiKey });
}
async function generateComponent(openai, projectRoot, section, customPrompt, designSystem = 'basic') {
    const { model } = await (0, project_env_1.getProjectEnv)(projectRoot);
    // Generate the template name with timestamp first
    const timestamp = Date.now();
    const baseName = (0, formatting_js_1.toCamelCase)(section.name);
    const fullName = (0, id_1.generateTemplateId)(baseName);
    const prompt = (0, prompts_1.createComponentPrompt)(section, fullName, customPrompt, designSystem);
    const completion = await openai.chat.completions.create({
        model,
        messages: [{
                role: "user",
                content: prompt
            }],
        temperature: 0.7,
    });
    const content = completion.choices[0].message.content;
    if (!content) {
        throw new Error('Empty response from OpenAI');
    }
    try {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (!jsonMatch) {
            throw new Error('No JSON block found in response');
        }
        const jsonStr = jsonMatch[1].trim();
        const result = JSON.parse(jsonStr);
        if (!result.metadata?.category || !result.code) {
            throw new Error('Invalid response structure');
        }
        // Use our pre-generated name instead of the one from OpenAI
        return {
            ...result.metadata,
            name: fullName,
            code: result.code
        };
    }
    catch (error) {
        console.error('Parse Error:', error);
        console.error('Raw Response:', content);
        throw new Error('Failed to parse OpenAI response');
    }
}
