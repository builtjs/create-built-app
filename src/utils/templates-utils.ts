import fs from 'fs/promises';
import path from 'path';
import { TemplatesData } from './../interfaces.js';

export async function readTemplatesFile(): Promise<TemplatesData> {
  try {
    const templatesPath = path.join(process.cwd(), 'public/data/templates.json');
    const data = await fs.readFile(templatesPath, 'utf-8');
    return JSON.parse(data) as TemplatesData;
  } catch (error) {
    throw new Error('Failed to read templates.json file');
  }
}

export async function updateTemplateImage(templateName: string, imageUrl: string): Promise<void> {
  const templatesPath = path.join(process.cwd(), 'public/data/templates.json');
  const templatesData = await readTemplatesFile();
  
  const templateIndex = templatesData.templates.findIndex(t => t.name === templateName);
  if (templateIndex === -1) {
    throw new Error(`Template "${templateName}" not found`);
  }
  
  templatesData.templates[templateIndex].imageUrl = imageUrl;
  
  await fs.writeFile(templatesPath, JSON.stringify(templatesData, null, 2));
}