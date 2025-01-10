"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeScreenshots = takeScreenshots;
const puppeteer_1 = __importDefault(require("puppeteer"));
const kebab_case_1 = __importDefault(require("kebab-case"));
const path_1 = __importDefault(require("path"));
const port_utils_js_1 = require("./port-utils.js");
async function takeScreenshots(page, customPort) {
    const browser = await puppeteer_1.default.launch();
    try {
        const port = customPort ? Number(customPort) : await (0, port_utils_js_1.findNextPort)();
        const tab = await browser.newPage();
        const pageUrl = `http://localhost:${port}/${(0, kebab_case_1.default)(page.name)}`;
        console.log(`📷 Taking screenshots from ${pageUrl}`);
        await tab.goto(pageUrl, { waitUntil: 'networkidle0' });
        for (const section of page.sections) {
            const element = await tab.$(`#${section.name}`);
            if (!element) {
                console.warn(`⚠️ Section "${section.name}" not found on page "${page.name}"`);
                continue;
            }
            const screenshotPath = path_1.default.join(process.cwd(), 'public/images/screenshots', `${section.name}.png`);
            await element.screenshot({
                path: screenshotPath,
                type: 'png'
            });
            console.log(`📸 Captured screenshot for section "${section.name}"`);
        }
    }
    finally {
        await browser.close();
    }
}
