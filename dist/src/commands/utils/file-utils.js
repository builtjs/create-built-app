"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readDataFile = readDataFile;
exports.ensureDirectoryExists = ensureDirectoryExists;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
async function readDataFile() {
    try {
        const dataPath = path_1.default.join(process.cwd(), '.built/data.json');
        const data = await promises_1.default.readFile(dataPath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        throw new Error('Failed to read data.json file. Make sure it exists in .built/');
    }
}
async function ensureDirectoryExists(dirPath) {
    try {
        await promises_1.default.access(dirPath);
    }
    catch {
        await promises_1.default.mkdir(dirPath, { recursive: true });
    }
}
