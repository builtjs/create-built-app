"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getThemeOrPlugin = getThemeOrPlugin;
exports.updateThemeOrPlugin = updateThemeOrPlugin;
exports.setupSite = setupSite;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const import_data_1 = require("../lib/setup/setup-site/import-data/import-data");
const setup_theme_1 = require("../lib/setup/setup-theme/setup-theme");
const apiKeyUtils_1 = require("../lib/apiKeyUtils");
const update_screenshots_1 = require("./update-screenshots");
async function getThemeOrPlugin(type, isConfig) {
    const themeFilePath = path.join(process.cwd(), `${isConfig ? 'config/' : ''}public/data/${type}.json`);
    try {
        const data = await fs_1.promises.readFile(themeFilePath, 'utf8');
        const parsedData = JSON.parse(data);
        return parsedData[type];
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            // File does not exist
            return null;
        }
        else if (error instanceof SyntaxError) {
            // JSON parsing error
            console.error(`Error parsing ${type}.json:`, error);
            throw error;
        }
        else {
            // Some other error occurred
            throw error;
        }
    }
}
async function fileExists(path) {
    try {
        await fs_1.promises.access(path);
        return true;
    }
    catch (error) {
        return false;
    }
}
async function updateThemeOrPlugin(options) {
    let type = 'theme';
    let themeOrPlugin = await getThemeOrPlugin('theme');
    if (!themeOrPlugin) {
        themeOrPlugin = await getThemeOrPlugin('plugin');
        type = 'plugin';
    }
    if (!themeOrPlugin) {
        console.error('Error: It looks like this not a theme or plugin. Update is only used on themes or plugins.');
        process.exit(1);
    }
    if (!themeOrPlugin) {
        console.error('Error: No theme or plugin.');
        process.exit(1);
    }
    let apiKey = await (0, apiKeyUtils_1.getApiKey)();
    if (!apiKey) {
        console.error('Unable to process API key.');
        process.exit(1);
    }
    console.log(chalk_1.default.blue(`Updating ${type}...`));
    const isValid = await (0, apiKeyUtils_1.validateApiKey)(apiKey);
    if (!isValid) {
        apiKey = await (0, apiKeyUtils_1.promptForApiKey)();
    }
    if (apiKey) {
        const isValid = await (0, apiKeyUtils_1.validateApiKey)(apiKey);
        if (isValid) {
            await (0, apiKeyUtils_1.saveApiKeyToConfig)(apiKey);
            if (options.screenshots) {
                let customPort;
                if (options.port || options.p) {
                    customPort = options.port ? options.port : options.p;
                }
                await (0, update_screenshots_1.updateScreenshots)(themeOrPlugin, type, customPort);
            }
            await (0, setup_theme_1.update)(themeOrPlugin, type, apiKey, process.cwd());
        }
        else {
            console.error('Unable to process API key.');
            process.exit(1);
        }
    }
    else {
        console.error('Unable to process API key.');
        process.exit(1);
    }
    console.log(chalk_1.default.green(`✓ Done!`));
}
async function setupSite() {
    const isPlugin = await fileExists(path.join(process.cwd(), 'public/data/plugin.json'));
    if (isPlugin) {
        console.error('Error: It looks like this is a plugin. Setup is only used on sites.');
        process.exit(1);
    }
    const theme = await getThemeOrPlugin('theme');
    if (theme) {
        console.error('Error: It looks like this is a theme. Setup is only used on sites.');
        process.exit(1);
    }
    const plugin = await getThemeOrPlugin('plugin');
    if (plugin) {
        console.error('Error: It looks like this is a plugin. Setup is only used on sites.');
        process.exit(1);
    }
    await (0, import_data_1.setupSiteData)();
}
