"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTemplate = createTemplate;
exports.createAllTemplates = createAllTemplates;
const process_section_1 = require("./process-section");
const files_1 = require("./utils/files");
const openai_1 = require("./utils/openai");
const chalk_1 = __importDefault(require("chalk"));
async function createTemplate(sectionName, options) {
    const projectRoot = process.cwd();
    const openai = await (0, openai_1.createOpenAIClient)(projectRoot);
    const sectionsData = await (0, files_1.readSectionsData)(projectRoot);
    const section = sectionsData.sections.find(s => s.name === sectionName);
    if (!section) {
        throw new Error(`Section "${sectionName}" not found`);
    }
    console.log(chalk_1.default.blue(`Creating template for section: ${section.name}...`));
    const { templateName, templateData } = await (0, process_section_1.processSection)(openai, projectRoot, section, options);
    if (!section.templates) {
        section.templates = [];
    }
    section.templates.push(templateName);
    section.defaultTemplate = { name: templateName };
    await (0, files_1.writeSectionsData)(projectRoot, sectionsData);
    console.log(chalk_1.default.green(`✓ Successfully created template "${templateName}" in category "${templateData.category}"`));
}
async function createAllTemplates(options) {
    const projectRoot = process.cwd();
    const openai = await (0, openai_1.createOpenAIClient)(projectRoot);
    const sectionsData = await (0, files_1.readSectionsData)(projectRoot);
    console.log(chalk_1.default.blue('Processing all sections...'));
    for (const section of sectionsData.sections) {
        try {
            console.log(chalk_1.default.yellow(`Processing section: ${section.name}`));
            const { templateName, templateData } = await (0, process_section_1.processSection)(openai, projectRoot, section, options);
            if (!section.templates) {
                section.templates = [];
            }
            section.templates.push(templateName);
            section.defaultTemplate = { name: templateName };
            console.log(chalk_1.default.green(`✓ Created template "${templateName}" in category "${templateData.category}"`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`✗ Error processing section "${section.name}":`, error instanceof Error ? error.message : String(error)));
        }
    }
    await (0, files_1.writeSectionsData)(projectRoot, sectionsData);
    console.log(chalk_1.default.green('\n✓ Finished processing all sections'));
}
