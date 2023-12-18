#! /usr/bin/env node

import {program} from 'commander';
import {
  init
} from './commands/init';

program
  .command('init')
  .description('Install Built.JS into projects.')
  .option('--type <string>', 'Install type - site, theme or plugin')
  .action(init);

program.parse();
