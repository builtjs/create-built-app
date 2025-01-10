"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readTemplatesFile = readTemplatesFile;
exports.updateTemplateImage = updateTemplateImage;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function readTemplatesFile() {
    try {
        const templatesPath = path_1.default.join(process.cwd(), 'public/data/templates.json');
        const data = await promises_1.default.readFile(templatesPath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        throw new Error('Failed to read templates.json file');
    }
}
async function updateTemplateImage(templateName, imageUrl) {
    const templatesPath = path_1.default.join(process.cwd(), 'public/data/templates.json');
    const templatesData = await readTemplatesFile();
    const templateIndex = templatesData.templates.findIndex(t => t.name === templateName);
    if (templateIndex === -1) {
        throw new Error(`Template "${templateName}" not found`);
    }
    templatesData.templates[templateIndex].imageUrl = imageUrl;
    await promises_1.default.writeFile(templatesPath, JSON.stringify(templatesData, null, 2));
}
