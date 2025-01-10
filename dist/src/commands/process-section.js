"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSection = processSection;
const openai_1 = require("./utils/openai");
const files_1 = require("./utils/files");
const formatting_1 = require("./utils/formatting");
async function processSection(openai, projectRoot, section, options) {
    const templateMetadata = await (0, openai_1.generateComponent)(openai, projectRoot, section, options.prompt, options.designSystem);
    const { componentName, fileName } = (0, formatting_1.formatComponentName)(templateMetadata.name);
    const templateData = {
        name: componentName,
        title: templateMetadata.title,
        description: templateMetadata.description,
        category: templateMetadata.category
    };
    // Update templates.json
    const templatesData = await (0, files_1.readTemplatesData)(projectRoot);
    templatesData.templates.push(templateData);
    await (0, files_1.writeTemplatesData)(projectRoot, templatesData);
    // Write the component file
    await (0, files_1.writeComponentFile)(projectRoot, templateData.category, fileName, templateMetadata.code);
    return { templateName: componentName, templateData };
}
