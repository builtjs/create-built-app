"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeScreenshots = takeScreenshots;
const puppeteer_1 = __importDefault(require("puppeteer"));
const kebab_case_1 = __importDefault(require("kebab-case"));
const path_1 = __importDefault(require("path"));
const cloudinary_utils_js_1 = require("./cloudinary-utils.js");
const templates_utils_js_1 = require("./templates-utils.js");
const pluralize_1 = __importDefault(require("pluralize"));
const file_utils_js_1 = require("./file-utils.js");
const LAPTOP_SCREEN_WIDTH = 1366;
const DEFAULT_PORT = 3000;
async function takeScreenshots(modulePage, pagesData, sectionsData, themeOrPlugin, type, hasCloudinary, customPort) {
    const port = customPort ? customPort : DEFAULT_PORT;
    const page = pagesData.pages.find(s => s.name === modulePage.page.name);
    if (!page) {
        return;
    }
    if (page.contentType) {
        let collectionFileName = (0, kebab_case_1.default)((0, pluralize_1.default)(page.contentType.name));
        let collectionData = await (0, file_utils_js_1.readCollectionFile)(collectionFileName);
        for (const entry of collectionData.data) {
            const pageUrl = `http://localhost:${port}/${(0, kebab_case_1.default)(page.contentType.name)}/${entry.slug}`;
            await processScreenshots(pageUrl, modulePage, sectionsData.sections, themeOrPlugin, type, hasCloudinary);
        }
    }
    else {
        const pageUrl = `http://localhost:${port}/${page.name !== 'home' ? (0, kebab_case_1.default)(page.name) : ''}`;
        await processScreenshots(pageUrl, modulePage, sectionsData.sections, themeOrPlugin, type, hasCloudinary);
    }
}
async function processScreenshots(pageUrl, modulePage, sections, themeOrPlugin, type, hasCloudinary) {
    const browser = await puppeteer_1.default.launch({ headless: 'new' });
    try {
        const tab = await browser.newPage();
        // Set viewport width to laptop size, height will adjust to content
        await tab.setViewport({
            width: LAPTOP_SCREEN_WIDTH,
            height: 1,
        });
        await tab.goto(pageUrl, { waitUntil: 'networkidle0' });
        for (const pageSection of modulePage.sections) {
            // Find the full section data from sections.json
            const section = sections.find(s => s.name === pageSection.name);
            if (!section) {
                continue;
            }
            const element = await tab.$(`#${section.defaultTemplate.name}`);
            if (!element) {
                console.log(`\nSection "${section.name}" (id: ${section.defaultTemplate.name}) not found on page "${pageUrl}"`);
                continue;
            }
            console.log(`Screenshotting "${section.name}" (template: "${section.defaultTemplate.name}")`);
            const screenshotPath = path_1.default.join(process.cwd(), 'public/images/screenshots', `${section.name}.png`);
            await element.screenshot({
                path: screenshotPath,
                type: 'png',
            });
            if (hasCloudinary) {
                try {
                    const publicId = `${type}/${themeOrPlugin.namespace}/${(0, kebab_case_1.default)(modulePage.page.name)}-${section.defaultTemplate.name}`;
                    const cloudinaryUrl = await (0, cloudinary_utils_js_1.uploadToCloudinary)(screenshotPath, publicId);
                    await (0, templates_utils_js_1.updateTemplateImage)(section.defaultTemplate.name, cloudinaryUrl);
                    console.log(`Uploaded to Cloudinary: ${section.defaultTemplate.name}`);
                }
                catch (error) {
                    console.log(`Failed to upload "${section.name}" to Cloudinary: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }
    }
    finally {
        await browser.close();
    }
}
