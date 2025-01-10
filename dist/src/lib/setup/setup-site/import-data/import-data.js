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
exports.setupSiteData = setupSiteData;
const chalk_1 = __importDefault(require("chalk"));
require("dotenv/config");
const next_sanity_1 = require("next-sanity");
const import_page_data_1 = __importDefault(require("./import-page-data"));
const import_entry_data_1 = __importDefault(require("./import-entry-data"));
const import_layout_data_1 = __importDefault(require("./import-layout-data"));
const import_global_data_1 = __importDefault(require("./import-global-data"));
const import_page_element_data_1 = __importDefault(require("./import-page-element-data"));
const import_element_data_1 = __importDefault(require("./import-element-data"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
const dataPath = path.join(process.cwd(), 'setup/data.json');
const getEnvVariable = (key) => {
    const value = process.env[key];
    if (!value) {
        console.error(`Error: Missing environment variable ${key}`);
        process.exit(1); // Exit if the required environment variable is not found
    }
    return value;
};
async function setupSiteData() {
    console.log(chalk_1.default.blue(`Seeding data into Sanity...`));
    let client;
    try {
        const sanityProjectId = getEnvVariable('NEXT_PUBLIC_SANITY_PROJECT_ID');
        const sanityDataset = getEnvVariable('NEXT_PUBLIC_SANITY_DATASET');
        const sanityWriteToken = getEnvVariable('NEXT_PUBLIC_SANITY_WRITE_TOKEN');
        const sanityApiVersion = getEnvVariable('NEXT_PUBLIC_SANITY_API_VERSION');
        client = (0, next_sanity_1.createClient)({
            projectId: sanityProjectId,
            dataset: sanityDataset,
            token: sanityWriteToken,
            useCdn: false,
            apiVersion: sanityApiVersion,
        });
    }
    catch (error) {
        console.error(`Failed to load environment variables: ${error.message}`);
        process.exit(1);
    }
    try {
        const data = JSON.parse(await fs_1.promises.readFile(dataPath, 'utf8'));
        await (0, import_global_data_1.default)(client, data.global);
        console.log('Global data import complete');
        await (0, import_element_data_1.default)(client, data.elements);
        console.log('Element data import complete');
        await (0, import_layout_data_1.default)(client, data.layout);
        console.log('Layout data import complete');
        await (0, import_page_element_data_1.default)(client, data);
        console.log('Page element data import complete');
        await (0, import_page_data_1.default)(client, data);
        console.log('Page data import complete');
        await (0, import_entry_data_1.default)(client, data.entries);
        const uploadsDirPath = `setup/uploads`;
        const uploadsPath = path.join(process.cwd(), uploadsDirPath);
        await fs_1.promises.rm(uploadsPath, { recursive: true, force: true });
        console.log(chalk_1.default.green(`✓ Done!`));
        process.exit(1);
    }
    catch (error) {
        console.error('Error importing data:', error);
    }
}
