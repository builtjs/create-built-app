import fs from 'fs/promises';
import path from 'path';
import { ProjectData } from '../../types';

export async function readDataFile(): Promise<ProjectData> {
  try {
    const dataPath = path.join(process.cwd(), '.built/data.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(data) as ProjectData;
  } catch (error) {
    throw new Error('Failed to read data.json file. Make sure it exists in .built/');
  }
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}