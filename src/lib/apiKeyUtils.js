import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import {Constants} from '../constants';

const configFilePath = path.resolve(__dirname, 'config.json');

export async function readApiKeyFromConfig() {
  try {
    if (fs.existsSync(configFilePath)) {
      const config = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
      return config.apiKey || null;
    }
    return null;
  } catch (error) {
    console.error('Error reading API key from config:', error);
    return null;
  }
}

export async function saveApiKeyToConfig(apiKey) {
  try {
    const config = {apiKey};
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving API key to config:', error);
  }
}

export async function promptForApiKey() {
  const questions = [
    {
      type: 'input',
      name: 'apiKey',
      message: 'Please enter your API key:',
    },
  ];

  const answers = await inquirer.prompt(questions);
  return answers.apiKey;
}

export async function validateApiKey(apiKey) {
  try {
    const url = `${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/api-keys/validate`;
    const response = await axios.post(url, { apiKey });
    return response.data.apiKey.isValid;
  } catch (error) {
    console.error('Error validating API key');
    return false;
  }
}

export async function getApiKey() {
  let apiKey = await readApiKeyFromConfig();

  if (!apiKey) {
    apiKey = await promptForApiKey();
  }
  return apiKey;
}
