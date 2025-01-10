"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readApiKeyFromConfig = readApiKeyFromConfig;
exports.saveApiKeyToConfig = saveApiKeyToConfig;
exports.promptForApiKey = promptForApiKey;
exports.validateApiKey = validateApiKey;
exports.getApiKey = getApiKey;
const inquirer_1 = __importDefault(require("inquirer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../constants");
const configFilePath = path_1.default.resolve(__dirname, 'config.json');
async function readApiKeyFromConfig() {
    try {
        if (fs_1.default.existsSync(configFilePath)) {
            const config = JSON.parse(fs_1.default.readFileSync(configFilePath, 'utf8'));
            return config.apiKey || null;
        }
        return null;
    }
    catch (error) {
        console.error('Error reading API key from config:', error);
        return null;
    }
}
async function saveApiKeyToConfig(apiKey) {
    try {
        const config = { apiKey };
        fs_1.default.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
    }
    catch (error) {
        console.error('Error saving API key to config:', error);
    }
}
async function promptForApiKey() {
    const questions = [
        {
            type: 'input',
            name: 'apiKey',
            message: 'Please enter your API key:',
        },
    ];
    const answers = await inquirer_1.default.prompt(questions);
    return answers.apiKey;
}
async function validateApiKey(apiKey) {
    try {
        const url = `${constants_1.Constants.API_URL}/v${constants_1.Constants.CURRENT_API_VERSION}/api-keys/validate`;
        const response = await axios_1.default.post(url, { apiKey });
        return response.data.apiKey.isValid;
    }
    catch (error) {
        console.error('Error validating API key');
        promptForApiKey();
        return false;
    }
}
async function getApiKey() {
    let apiKey = await readApiKeyFromConfig();
    if (!apiKey) {
        apiKey = await promptForApiKey();
    }
    return apiKey;
}
