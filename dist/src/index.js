#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const init_1 = require("./commands/init");
const publish_1 = require("./commands/publish");
const setup_1 = require("./commands/setup");
const validation_1 = require("./commands/validation");
const create_js_1 = require("../src/commands/create.js");
commander_1.program
    .command('init')
    .description('Install Built.JS into projects.')
    .option('--type <string>', 'Install type - site, theme or plugin')
    .action(init_1.init);
commander_1.program
    .command('publish')
    .description('Import theme or plugin into Built Studio.')
    .option('--type <string>', 'Publish type - theme or plugin')
    .action(publish_1.publish);
commander_1.program
    .command('setup')
    .description('Setup site.')
    .action(setup_1.setupSite);
commander_1.program
    .command('update')
    .description('Update theme.')
    .option('--screenshots', 'Update screenshots for all sections')
    .option('-p, --port <number>', 'Specify the port number of the Next.js app')
    .action(setup_1.updateThemeOrPlugin);
commander_1.program
    .command('create')
    .description('Create a new template based on a section description')
    .argument('type', 'Type of creation (template)')
    .option('--section <name>', 'Section name to use as reference (optional, if not provided will process all sections)')
    .option('--prompt <description>', 'Custom UI description for the template(s)')
    .option('--design-system <type>', 'Design system to use (basic or shadcn)', 'basic')
    .action(async (type, options) => {
    if (type === 'template') {
        try {
            (0, validation_1.validateCreateOptions)(options);
            if (options.section) {
                await (0, create_js_1.createTemplate)(options.section, options);
            }
            else {
                await (0, create_js_1.createAllTemplates)(options);
            }
        }
        catch (error) {
            console.error('Error:', error instanceof Error ? error.message : String(error));
            process.exit(1);
        }
    }
});
commander_1.program.parse();
