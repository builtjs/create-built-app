import fs from 'fs/promises';
import path from 'path';

export async function readDataFile() {
  try {
    const dataPath = path.join(process.cwd(), 'public/data/_built/data.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error('Failed to read data.json file. Make sure it exists in public/data/_built/');
  }
}

export async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}