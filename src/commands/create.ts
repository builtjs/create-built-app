import { processSection } from './process-section';
import { readSectionsData, writeSectionsData } from './utils/files';
import { createOpenAIClient } from './utils/openai';
import chalk from 'chalk';
import { CreateCommandOptions } from '../types';

export async function createTemplate(sectionName: string, options: CreateCommandOptions): Promise<void> {
  const projectRoot = process.cwd();
  const openai = await createOpenAIClient(projectRoot);

  const sectionsData = await readSectionsData(projectRoot);
  const section = sectionsData.sections.find(s => s.name === sectionName);
  
  if (!section) {
    throw new Error(`Section "${sectionName}" not found`);
  }

  console.log(chalk.blue(`Creating template for section: ${section.name}...`));
  
  const { templateName, templateData } = await processSection(openai, projectRoot, section, options);

  if (!section.templates) {
    section.templates = [];
  }
  section.templates.push(templateName);
  section.defaultTemplate = { name: templateName };
  await writeSectionsData(projectRoot, sectionsData);

  console.log(chalk.green(`✓ Successfully created template "${templateName}" in category "${templateData.category}"`));
}

export async function createAllTemplates(options: CreateCommandOptions): Promise<void> {
  const projectRoot = process.cwd();
  const openai = await createOpenAIClient(projectRoot);
  const sectionsData = await readSectionsData(projectRoot);
  
  console.log(chalk.blue('Processing all sections...'));

  for (const section of sectionsData.sections) {
    try {
      console.log(chalk.yellow(`Processing section: ${section.name}`));
      const { templateName, templateData } = await processSection(openai, projectRoot, section, options);

      if (!section.templates) {
        section.templates = [];
      }
      section.templates.push(templateName);
      section.defaultTemplate = { name: templateName };
      console.log(chalk.green(`✓ Created template "${templateName}" in category "${templateData.category}"`));
    } catch (error) {
      console.error(chalk.red(`✗ Error processing section "${section.name}":`, error instanceof Error ? error.message : String(error)));
    }
  }

  await writeSectionsData(projectRoot, sectionsData);
  console.log(chalk.green('\n✓ Finished processing all sections'));
}