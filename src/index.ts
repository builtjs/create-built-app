#! /usr/bin/env node

import {program} from 'commander';
import {init} from './commands/init';
import {publish} from './commands/publish';
import {setupSite, updateThemeOrPlugin} from './commands/setup';

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

program.parse();