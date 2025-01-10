"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSectionsData = readSectionsData;
exports.readTemplatesData = readTemplatesData;
exports.writeTemplatesData = writeTemplatesData;
exports.writeSectionsData = writeSectionsData;
exports.writeComponentFile = writeComponentFile;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
async function readSectionsData(projectRoot) {
    const sectionsPath = path_1.default.join(projectRoot, 'public/data/sections.json');
    return await fs_extra_1.default.readJson(sectionsPath);
}
async function readTemplatesData(projectRoot) {
    const templatesPath = path_1.default.join(projectRoot, 'public/data/templates.json');
    return await fs_extra_1.default.readJson(templatesPath).catch(() => ({ templates: [] }));
}
async function writeTemplatesData(projectRoot, data) {
    const templatesPath = path_1.default.join(projectRoot, 'public/data/templates.json');
    await fs_extra_1.default.writeJson(templatesPath, data, { spaces: 2 });
}
async function writeSectionsData(projectRoot, data) {
    const sectionsPath = path_1.default.join(projectRoot, 'public/data/sections.json');
    await fs_extra_1.default.writeJson(sectionsPath, data, { spaces: 2 });
}
async function writeComponentFile(projectRoot, category, fileName, content) {
    const componentDir = path_1.default.join(projectRoot, 'components', 'templates', category);
    await fs_extra_1.default.ensureDir(componentDir);
    await fs_extra_1.default.writeFile(path_1.default.join(componentDir, `${fileName}.tsx`), content);
}
