import fs from 'fs/promises';
import path from 'path';
import { BuiltData, CollectionData, ModulePagesData, PagesData, SectionsData } from './../interfaces.js';

export async function readDataFile(): Promise<BuiltData> {
  try {
    const dataPath = path.join(process.cwd(), 'public/data/_built/data.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(data) as BuiltData;
  } catch (error) {
    throw new Error('Failed to read data.json file. Make sure it exists in public/data/_built/');
  }
}

export async function readModulePagesFile(): Promise<ModulePagesData> {
  try {
    const modulePagesPath = path.join(process.cwd(), 'public/data/module-pages.json');
    const data = await fs.readFile(modulePagesPath, 'utf-8');
    return JSON.parse(data) as ModulePagesData;
  } catch (error) {
    throw new Error('Failed to read module-pages.json file. Make sure it exists in public/data/');
  }
}

export async function readPagesFile(): Promise<PagesData> {
  try {
    const pagesPath = path.join(process.cwd(), 'public/data/pages.json');
    const data = await fs.readFile(pagesPath, 'utf-8');
    return JSON.parse(data) as PagesData;
  } catch (error) {
    throw new Error('Failed to read pages.json file. Make sure it exists in public/data/');
  }
}

export async function readCollectionFile(collectionName: string): Promise<CollectionData> {
  try {
    console.log( `public/data/collections/${collectionName}.json`)
    const pagesPath = path.join(process.cwd(), `public/data/collections/${collectionName}.json`);
    const data = await fs.readFile(pagesPath, 'utf-8');
    return JSON.parse(data) as CollectionData;
  } catch (error) {
    throw new Error(`Failed to read ${collectionName}.json file. Make sure it exists in public/data/collections`);
  }
}

export async function readSectionsFile(): Promise<SectionsData> {
  try {
    const sectionsPath = path.join(process.cwd(), 'public/data/sections.json');
    const data = await fs.readFile(sectionsPath, 'utf-8');
    return JSON.parse(data) as SectionsData;
  } catch (error) {
    throw new Error('Failed to read sections.json file. Make sure it exists in public/data/');
  }
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}