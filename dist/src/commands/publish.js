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
exports.getCombinedData = getCombinedData;
exports.sendRequest = sendRequest;
exports.publish = publish;
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
const apiKeyUtils_1 = require("../lib/apiKeyUtils");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const constants_1 = require("../constants");
const utils_1 = require("../utils");
const zlib = __importStar(require("zlib"));
async function publish() {
    console.log(chalk_1.default.blue(`Publishing...`));
    const { combinedData, type } = await getCombinedData(true);
    // Compress combinedData before sending
    const compressedData = compressData(combinedData);
    try {
        await sendRequest(type, compressedData);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('Failed to upload data and components:', error.message);
        }
        else {
            console.error('Failed to upload data and components:', error);
        }
    }
}
function getCombinedData(collectFilesData) {
    return new Promise(resolve => {
        const publicDir = path.join(process.cwd(), 'public/data');
        const srcDir = (0, utils_1.getSrcDir)();
        const componentsDir = `${srcDir}/components`;
        const libDir = `${srcDir}/lib`;
        const hooksDir = `${srcDir}/hooks`;
        const stylesDir = `${srcDir}/styles`;
        const apiDir = `${srcDir}/pages/api`;
        const jsonFiles = getAllFiles(publicDir).filter(file => file.path.endsWith('.json'));
        const combinedData = {
            data: {},
            components: {},
            lib: {},
            hooks: {},
            styles: {},
            api: {},
            config: {},
        };
        collectData(publicDir, jsonFiles, combinedData.data, true);
        let type = null;
        if (combinedData.data['theme.json']) {
            type = constants_1.Constants.TYPES.theme;
        }
        else if (combinedData.data['plugin.json']) {
            type = constants_1.Constants.TYPES.plugin;
        }
        else {
            console.error('Project is neither a theme nor plugin. No theme.json or plugin.json file found.');
            process.exit(1);
        }
        if (!collectFilesData) {
            return resolve({ combinedData, type });
        }
        const componentFiles = getAllFiles(componentsDir);
        collectData(componentsDir, componentFiles, combinedData.components);
        const libFiles = getAllFiles(libDir);
        collectData(libDir, libFiles, combinedData.lib);
        const hooksFiles = getAllFiles(hooksDir);
        collectData(hooksDir, hooksFiles, combinedData.hooks);
        const stylesFiles = getAllFiles(stylesDir);
        collectData(stylesDir, stylesFiles, combinedData.styles);
        const apiFiles = getAllFiles(apiDir);
        collectData(apiDir, apiFiles, combinedData.api);
        collectAllConfigData(combinedData, srcDir);
        return resolve({ combinedData, type });
    });
}
function collectAllConfigData(data, srcDir) {
    const files = [
        { path: 'tailwind.config.js', required: true },
        { path: 'postcss.config.js', required: true },
        { path: 'next.config.js', required: true },
        { path: 'jsconfig.site.json', required: false },
        { path: '.env.example', required: false },
        { path: 'README.site.md', required: false },
        { path: `${srcDir}/pages/_app.tsx`, required: true },
        { path: `${srcDir}/pages/_document.tsx`, required: false },
    ];
    files.map(file => collectConfigData(file, '', data, file.path.endsWith('.json')));
}
function collectData(baseDir, files, targetObject, isJson = false) {
    for (const file of files) {
        const result = getFile(baseDir, file);
        const { relativePath, fileContent } = result;
        if (!relativePath || !fileContent) {
            continue;
        }
        // Standardize the relative path
        const standardizedPath = path.posix.join(...relativePath.split(path.sep));
        targetObject[standardizedPath] = isJson ? JSON.parse(fileContent) : fileContent;
    }
}
function removeSubstringFromStart(str, substring) {
    if (str.startsWith(substring)) {
        return str.slice(substring.length);
    }
    return str;
}
function collectConfigData(file, baseDir, targetObject, isJson = false) {
    const result = getFile(baseDir, file);
    const { relativePath, fileContent } = result;
    if (!relativePath || !fileContent) {
        return;
    }
    targetObject.config[relativePath] = isJson
        ? JSON.parse(fileContent)
        : fileContent;
}
function getFile(baseDir, file) {
    // Ensure absolute paths
    const absoluteBaseDir = path.resolve(baseDir);
    const absoluteFilePath = path.resolve(file.path);
    // Get relative path and sanitize
    const sanitizedPath = sanitizeFilePath(path.relative(absoluteBaseDir, absoluteFilePath));
    if (!isValidFileType(sanitizedPath) || !isFileSizeValid(file)) {
        console.warn(`Skipping invalid or large file: ${sanitizedPath}`);
        return { relativePath: null, fileContent: null };
    }
    if (!fs.existsSync(absoluteFilePath)) {
        if (file.required) {
            console.error(`Error: Required file not found: ${absoluteFilePath}`);
            process.exit(1);
        }
        return { relativePath: null, fileContent: null };
    }
    let fileContent = null;
    try {
        fileContent = fs.readFileSync(absoluteFilePath, 'utf8');
    }
    catch (error) {
        const nodeError = error;
        if (nodeError.code === 'ENOENT') {
            if (file.required) {
                console.error(`Error: Required file not found: ${absoluteFilePath}`);
                process.exit(1);
            }
        }
        else {
            console.error(`Error: Unable to read file: ${absoluteFilePath}`, error);
            if (file.required)
                process.exit(1);
        }
    }
    const relativePath = removeSubstringFromStart(sanitizedPath, 'src/');
    return { relativePath, fileContent };
}
function sanitizeFilePath(filePath) {
    return path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
}
function isValidFileType(fileName) {
    const allowedExtensions = [
        '.json',
        '.js',
        '.css',
        '.ts',
        '.jsx',
        '.tsx',
        '.md',
        '.example',
    ];
    const fileExtension = path.extname(fileName).toLowerCase();
    return allowedExtensions.includes(fileExtension);
}
function isFileSizeValid(file) {
    try {
        const stats = fs.statSync(file.path);
        const maxSize = 5 * 1024 * 1024; // 5MB limit
        return stats.size <= maxSize;
    }
    catch (error) {
        const nodeError = error;
        if (nodeError.code === 'ENOENT') {
            if (file.required) {
                console.error(`Error: Required file not found: ${file.path}`);
                process.exit(1);
            }
            else {
                return true;
            }
        }
        else {
            console.error(`Error: Unable to check file size: ${file.path}`, error);
            if (file.required)
                process.exit(1);
        }
        return false;
    }
}
function compressData(data) {
    const jsonData = JSON.stringify(data);
    const compressedData = zlib.gzipSync(jsonData);
    return compressedData;
}
async function sendRequest(type, data) {
    try {
        let apiKey = await (0, apiKeyUtils_1.getApiKey)();
        if (!apiKey) {
            console.error('Unable to process API key.');
            process.exit(1);
        }
        const isValid = await (0, apiKeyUtils_1.validateApiKey)(apiKey);
        if (!isValid) {
            apiKey = await (0, apiKeyUtils_1.promptForApiKey)();
        }
        await (0, apiKeyUtils_1.saveApiKeyToConfig)(apiKey);
        try {
            const response = await axios_1.default.post(`${constants_1.Constants.API_URL}/v${constants_1.Constants.CURRENT_API_VERSION}/${type}s/publish`, data, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Encoding': 'gzip',
                    'x-api-key': apiKey,
                },
            });
            if (response.data && response.data.success && response.data.url) {
                console.log(`Your ${type} has been ${response.data.action === 'create' ? 'published' : 'updated'} in Built Studio!\nView the ${type} at: ${response.data.url}`);
            }
            else {
                console.error(`Failed to publish ${type}.`);
            }
        }
        catch (error) {
            console.error('Failed to publish:', error.message);
            if (error.response) {
                if (error.response.data.message) {
                    let msg = error.response.data.message;
                    // if (error.response.data.docsUrl) {
                    //   msg += `. Find out more at https://docs.builtjs.com/${error.response.data.docsUrl}`;
                    // }
                    console.error(msg);
                    if (error.response.data.message === 'Invalid API key') {
                        apiKey = await (0, apiKeyUtils_1.promptForApiKey)();
                    }
                }
            }
            process.exit(1);
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
}
function getAllFiles(dirPath, files = [], required = false) {
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.resolve(path.join(dirPath, entry.name));
            if (entry.isDirectory()) {
                getAllFiles(fullPath, files);
            }
            else if (entry.isFile()) {
                files.push({
                    path: fullPath,
                    required: true,
                });
            }
        }
    }
    catch (error) {
        if (required) {
            console.error(`Error: Unable to read directory: ${dirPath}`);
            process.exit(1);
        }
        return [];
    }
    return files;
}
