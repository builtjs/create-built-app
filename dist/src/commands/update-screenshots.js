"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateScreenshots = updateScreenshots;
const chalk_1 = __importDefault(require("chalk"));
const file_utils_1 = require("../utils/file-utils");
const screenshot_utils_1 = require("../utils/screenshot-utils");
const file_utils_2 = require("../utils/file-utils");
const cloudinary_utils_1 = require("../utils/cloudinary-utils");
async function updateScreenshots(themeOrPlugin, type, customPort) {
    console.log(chalk_1.default.blue(`📸 Updating screenshots...\n`));
    try {
        // Read both data files
        const [modulePagesData, pagesData, sectionsData] = await Promise.all([
            (0, file_utils_1.readModulePagesFile)(),
            (0, file_utils_1.readPagesFile)(),
            (0, file_utils_1.readSectionsFile)()
        ]);
        // Ensure screenshots directory exists
        await (0, file_utils_2.ensureDirectoryExists)('public/images/screenshots');
        const hasCloudinary = await (0, cloudinary_utils_1.initCloudinary)();
        // Process each page and take screenshots
        for (const modulePage of modulePagesData.modulePages) {
            console.log(`Processing page: ${modulePage.page.name}`);
            await (0, screenshot_utils_1.takeScreenshots)(modulePage, pagesData, sectionsData, themeOrPlugin, type, hasCloudinary, customPort);
        }
        console.log(`Screenshots updated successfully!\n`);
    }
    catch (error) {
        process.exit(1);
    }
}
