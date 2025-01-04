import { config } from 'dotenv';
import { OpenAIConfig } from '../../types';

config();

export function getOpenAIConfig(): OpenAIConfig {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4';

  if (!apiKey) {
    throw new Error('OpenAI API key not found in .env file');
  }

  return { apiKey, model };
}