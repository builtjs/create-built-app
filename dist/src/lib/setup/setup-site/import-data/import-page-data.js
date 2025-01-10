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
exports.default = importPageData;
const fileUtils = __importStar(require("../file-utils"));
const create_page_1 = __importDefault(require("../create-page"));
// Main function to import page data
async function importPageData(client, data) {
    if (!data?.pages) {
        return;
    }
    for (let i = 0; i < data.pages.length; i++) {
        const pageData = data.pages[i];
        if (!pageData) {
            continue;
        }
        for (let j = 0; j < pageData.data.sections.length; j++) {
            const section = pageData.data.sections[j];
            if (!section) {
                continue;
            }
            const pageFiles = await fileUtils.getFilesData(pageData.files?.page);
            const elementFiles = await fileUtils.getFilesData(pageData.files?.elements);
            const files = { ...pageFiles, ...elementFiles };
            await (0, create_page_1.default)(section, client, pageData.data, files);
        }
    }
}
