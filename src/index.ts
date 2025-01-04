#! /usr/bin/env node

import {program} from 'commander';
import {init} from './commands/init';
import {publish} from './commands/publish';
import {setupSite, updateThemeOrPlugin} from './commands/setup';
import {validateCreateOptions} from './commands/validation';
import { createTemplate, createAllTemplates } from '../src/commands/create.js';
import { CreateCommandOptions } from './types';

program
  .command('init')
  .description('Install Built.JS into projects.')
  .option('--type <string>', 'Install type - site, theme or plugin')
  .action(init);

  program
  .command('publish')
  .description('Import theme or plugin into Built Studio.')
  .option('--type <string>', 'Publish type - theme or plugin')
  .action(publish);

  program
  .command('setup')
  .description('Setup site.')
  .action(setupSite);

  program
  .command('update')
  .description('Update theme.')
  .option('--screenshots', 'Update screenshots for all sections')
  .option('-p, --port <number>', 'Specify the port number of the Next.js app')
  .action(updateThemeOrPlugin);

  program
  .command('create')
  .description('Create a new template based on a section description')
  .argument('type', 'Type of creation (template)')
  .option('--section <name>', 'Section name to use as reference (optional, if not provided will process all sections)')
  .option('--prompt <description>', 'Custom UI description for the template(s)')
  .option('--design-system <type>', 'Design system to use (basic or shadcn)', 'basic')
  .action(async (type: string, options: CreateCommandOptions) => {
    if (type === 'template') {
      try {
        validateCreateOptions(options);
        
        if (options.section) {
          await createTemplate(options.section, options);
        } else {
          await createAllTemplates(options);
        }
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  });

program.parse();