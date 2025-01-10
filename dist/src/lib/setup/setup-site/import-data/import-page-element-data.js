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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = importPageElementData;
const fs_1 = require("fs");
const fileUtils = __importStar(require("../file-utils"));
async function importPageElementData(client, data) {
    if (!data.pages || !data.elements) {
        return;
    }
    for (const [index, pageData] of data.pages.entries()) {
        // Loop sections
        if (pageData.data?.sections) {
            for (const [sectionIndex, section] of pageData.data.sections.entries()) {
                pageData.data.sections[sectionIndex] = await uploadElementFiles(section, pageData, data.elements, sectionIndex, client);
            }
        }
    }
}
async function uploadElementFiles(section, pageData, elementsData, index, client) {
    for (const prop in section) {
        if (Object.prototype.hasOwnProperty.call(section, prop)) {
            const attributeName = `contentSections.${index}.${prop}`;
            if (pageData.files?.elements?.[attributeName]) {
                const elementRef = section[prop];
                for (const fileProp in pageData.files.elements[attributeName]) {
                    if (Object.prototype.hasOwnProperty.call(pageData.files.elements[attributeName], fileProp)) {
                        let fileData = pageData.files.elements[attributeName][fileProp];
                        if (!Array.isArray(fileData)) {
                            fileData = [fileData];
                        }
                        // Convert array to record format
                        const fileRecord = { [fileProp]: fileData };
                        const files = await fileUtils.getFilesData(fileRecord);
                        if (files) {
                            for (const [, fileArray] of Object.entries(files)) {
                                for (const file of fileArray) {
                                    const filePath = file.path;
                                    // Import image asset
                                    const imageAsset = await client.assets.upload('image', (0, fs_1.createReadStream)(filePath));
                                    const asset = {
                                        _type: 'image',
                                        asset: {
                                            _ref: imageAsset._id,
                                            _type: 'reference',
                                        },
                                    };
                                    if (Array.isArray(elementRef)) {
                                        const ref = elementRef[index];
                                        setElement(elementsData, ref, prop, asset);
                                    }
                                    else {
                                        setElement(elementsData, elementRef, prop, asset);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return section;
}
function setElement(elementsData, ref, prop, asset) {
    for (const elementData of elementsData.data) {
        if (elementData._id === ref._ref) {
            elementData[prop] = asset;
            break;
        }
    }
}
