"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateImagesForThemeOrPlugin = updateImagesForThemeOrPlugin;
exports.updateImages = updateImages;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const pluralize_1 = __importDefault(require("pluralize"));
const file_utils_1 = require("../setup-site/file-utils");
// Utility function to read JSON files
async function readJsonFile(filePath) {
    const data = await fs_1.promises.readFile(filePath, 'utf-8');
    return JSON.parse(data);
}
// Function to find image fields in global schema
function findImageFieldsInGlobal(global) {
    return Object.keys(global.fields).filter(field => global.fields[field].type === 'image');
}
// Function to find image fields in sections schema
function findImageFieldsInSections(sections) {
    const result = {};
    for (const sectionName in sections) {
        const fields = sections[sectionName].fields;
        if (fields) {
            const imageFields = Object.keys(fields).filter(field => fields[field].type === 'image');
            if (imageFields.length > 0) {
                result[sectionName] = { fields: imageFields };
            }
        }
    }
    return result;
}
// Function to find image fields in elements schema
function findImageFieldsInElements(elements) {
    const result = {};
    for (const element of elements) {
        const fields = element.fields;
        if (fields) {
            const imageFields = Object.keys(fields).filter(field => fields[field].type === 'image');
            if (imageFields.length > 0) {
                result[element.name] = { fields: imageFields };
            }
        }
    }
    return result;
}
// Function to find image fields in sections schema
function findImageFieldsInContentTypes(contentTypes) {
    const result = {};
    for (const contentType of contentTypes) {
        const fields = contentType.fields;
        if (fields) {
            const imageFields = Object.keys(fields).filter(field => fields[field].type === 'image');
            if (imageFields.length > 0) {
                result[contentType.name] = { fields: imageFields };
            }
        }
    }
    return result;
}
function getImageDataFromBuilt(builtData, globalSchemaImageFields, sectionSchemaImageFields, contentTypeSchemaImageFields, elementSchemaImageFields) {
    const images = [];
    const addedPaths = new Set(); // Set to track added paths
    // Helper function to add an image path if it doesn't already exist
    function addImage(image) {
        if (!addedPaths.has(image.path)) {
            images.push(image);
            addedPaths.add(image.path);
        }
    }
    if (builtData.global && globalSchemaImageFields) {
        const globalData = builtData.global;
        globalSchemaImageFields.forEach(field => {
            const image = globalData[field];
            if (image && image.path && image.url) {
                addImage(image);
            }
        });
    }
    // Get section images
    builtData.sections.forEach(section => {
        if (section.data) {
            const sectionName = section.name;
            if (sectionSchemaImageFields[sectionName]) {
                sectionSchemaImageFields[sectionName].fields.forEach(field => {
                    const image = section.data[field];
                    if (image && image.path && image.url) {
                        addImage(image);
                    }
                });
            }
            Object.keys(section.data).map((fieldOrArray) => {
                if (Array.isArray(section.data[fieldOrArray])) {
                    let singularName = pluralize_1.default.singular(fieldOrArray);
                    section.data[fieldOrArray].forEach((element) => {
                        for (const key in element) {
                            if (elementSchemaImageFields[singularName] &&
                                elementSchemaImageFields[singularName].fields &&
                                elementSchemaImageFields[singularName].fields.includes(key)) {
                                const image = element[key];
                                if (image && image.path && image.url) {
                                    addImage(image);
                                }
                            }
                        }
                    });
                }
                else {
                    for (const key in fieldOrArray) {
                        if (sectionSchemaImageFields[key]) {
                            const image = fieldOrArray[key];
                            if (image && image.path && image.url) {
                                addImage(image);
                            }
                        }
                    }
                }
            });
        }
    });
    // Get collection images
    builtData.contentTypes.forEach(contentType => {
        const contentTypeName = contentType.name;
        if (contentTypeSchemaImageFields[contentTypeName]) {
            contentTypeSchemaImageFields[contentTypeName].fields.forEach(field => {
                const collectionName = (0, pluralize_1.default)(contentTypeName);
                const dataArray = builtData.collections[collectionName];
                // Ensure `dataArray` is an array and iterate over it
                if (Array.isArray(dataArray)) {
                    dataArray.forEach(item => {
                        // Check if the object contains the field and the field has a path
                        const image = item[field];
                        if (image && image.path && image.url) {
                            addImage(image);
                        }
                    });
                }
            });
        }
    });
    return images;
}
async function downloadAndSaveImages(images, to) {
    const publicPath = `./public`;
    const uploadsPath = path_1.default.resolve(to, publicPath);
    for (const image of images) {
        await (0, file_utils_1.downloadImage)(image, uploadsPath);
    }
}
async function updateImagesForThemeOrPlugin(themeOrPlugin, frontendPath, builtData, type, isConfig) {
    await updateImages(builtData, frontendPath);
    if (type === 'theme' && themeOrPlugin.plugins) {
        for (const pluginNamespace of themeOrPlugin.plugins) {
            await updateImages(builtData, frontendPath, pluginNamespace, true);
        }
    }
}
async function updateImages(builtData, projectRoot, namespace, isPluginForTheme) {
    let pluginPath = '';
    if (isPluginForTheme) {
        pluginPath = `/plugins/${namespace}`;
    }
    // Define paths to the schema and data files
    const sectionsSchemaPath = path_1.default.join(projectRoot, `public/data${pluginPath}/schemas/sections.json`);
    const contentTypesSchemaPath = path_1.default.join(projectRoot, `public/data${pluginPath}/schemas/content-types.json`);
    const elementsSchemaPath = path_1.default.join(projectRoot, `public/data${pluginPath}/schemas/elements.json`);
    const globalSchemaPath = path_1.default.join(projectRoot, `public/data${pluginPath}/schemas/global.json`);
    // Required schemas: sections and contentTypes
    let sectionsSchema;
    let contentTypesSchema;
    try {
        sectionsSchema = (await readJsonFile(sectionsSchemaPath));
    }
    catch (error) {
        throw new Error(`Failed to load sections schema from ${sectionsSchemaPath}`);
    }
    try {
        contentTypesSchema = (await readJsonFile(contentTypesSchemaPath));
    }
    catch (error) {
        throw new Error(`Failed to load content types schema from ${contentTypesSchemaPath}`);
    }
    // Optional schemas: elements and global
    let elementsSchema = null;
    try {
        elementsSchema = (await readJsonFile(elementsSchemaPath));
    }
    catch (error) {
        // do nothing, elements are optional
    }
    let globalSchema = null;
    try {
        globalSchema = (await readJsonFile(globalSchemaPath));
    }
    catch (error) {
        // do nothing, global is optional
    }
    // Find image fields
    let globalSchemaImageFields = null;
    if (globalSchema?.global) {
        globalSchemaImageFields = findImageFieldsInGlobal(globalSchema.global);
    }
    const sectionSchemaImageFields = findImageFieldsInSections(sectionsSchema.sections);
    const contentTypeSchemaImageFields = findImageFieldsInContentTypes(contentTypesSchema.contentTypes);
    const elementSchemaImageFields = elementsSchema?.elements
        ? findImageFieldsInElements(elementsSchema.elements)
        : {};
    // Get image data
    const images = getImageDataFromBuilt(builtData, globalSchemaImageFields, sectionSchemaImageFields, contentTypeSchemaImageFields, elementSchemaImageFields);
    // Download and save images
    await downloadAndSaveImages(images, projectRoot);
}
