import OpenAI from 'openai';
import { generateComponent } from './utils/openai';
import { readTemplatesData, writeTemplatesData, writeComponentFile, readSectionsData, writeSectionsData } from './utils/files';
import { formatComponentName } from './utils/formatting';
import { Section, Template } from '../interfaces';
import { CreateCommandOptions } from '../types';

interface ProcessSectionResult {
  templateName: string;
  templateData: Template;
}

export async function processSection(
  openai: OpenAI, 
  projectRoot: string, 
  section: Section, 
  options: CreateCommandOptions
): Promise<ProcessSectionResult> {
  const templateMetadata = await generateComponent(
    openai, 
    projectRoot, 
    section, 
    options.prompt,
    options.designSystem
  );
  
  const { componentName, fileName } = formatComponentName(templateMetadata.name);

  const templateData: Template = {
    name: componentName,
    title: templateMetadata.title,
    description: templateMetadata.description,
    category: templateMetadata.category
  };

  // Update templates.json
  const templatesData = await readTemplatesData(projectRoot);
  templatesData.templates.push(templateData);
  await writeTemplatesData(projectRoot, templatesData);

  // Write the component file
  await writeComponentFile(projectRoot, templateData.category, fileName, templateMetadata.code);

  return { templateName: componentName, templateData };
}