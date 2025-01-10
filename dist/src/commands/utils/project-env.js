"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectEnv = getProjectEnv;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
async function getProjectEnv(projectRoot) {
    const envPath = path_1.default.join(projectRoot, '.env');
    if (!await fs_extra_1.default.pathExists(envPath)) {
        throw new Error('No .env file found in project root. Please create one with OPENAI_API_KEY.');
    }
    const envContent = await fs_extra_1.default.readFile(envPath, 'utf-8');
    const env = dotenv_1.default.parse(envContent);
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not found in project .env file');
    }
    return {
        apiKey,
        model: env.OPENAI_MODEL || 'gpt-4'
    };
}
