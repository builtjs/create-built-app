import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { OpenAIConfig } from '../../types';

export async function getProjectEnv(projectRoot: string): Promise<OpenAIConfig> {
  const envPath = path.join(projectRoot, '.env');
  
  if (!await fs.pathExists(envPath)) {
    throw new Error('No .env file found in project root. Please create one with OPENAI_API_KEY.');
  }

  const envContent = await fs.readFile(envPath, 'utf-8');
  const env = dotenv.parse(envContent);

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not found in project .env file');
  }

  return {
    apiKey,
    model: env.OPENAI_MODEL || 'gpt-4'
  };
}