import fs from 'fs-extra';
import path from 'path';
import { SectionsData, TemplatesData } from '../../interfaces.js';

export async function readSectionsData(projectRoot: string): Promise<SectionsData> {
  const sectionsPath = path.join(projectRoot, 'public/data/sections.json');
  return await fs.readJson(sectionsPath);
}

export async function readTemplatesData(projectRoot: string): Promise<TemplatesData> {
  const templatesPath = path.join(projectRoot, 'public/data/templates.json');
  return await fs.readJson(templatesPath).catch(() => ({ templates: [] }));
}

export async function writeTemplatesData(projectRoot: string, data: TemplatesData): Promise<void> {
  const templatesPath = path.join(projectRoot, 'public/data/templates.json');
  await fs.writeJson(templatesPath, data, { spaces: 2 });
}

export async function writeSectionsData(projectRoot: string, data: SectionsData): Promise<void> {
  const sectionsPath = path.join(projectRoot, 'public/data/sections.json');
  await fs.writeJson(sectionsPath, data, { spaces: 2 });
}

export async function writeComponentFile(
  projectRoot: string, 
  category: string, 
  fileName: string, 
  content: string
): Promise<void> {
  const componentDir = path.join(projectRoot, 'components', 'templates', category);
  await fs.ensureDir(componentDir);
  await fs.writeFile(path.join(componentDir, `${fileName}.tsx`), content);
}