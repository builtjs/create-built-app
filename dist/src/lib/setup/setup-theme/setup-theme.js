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
exports.update = update;
exports.transformData = transformData;
const axios_1 = __importDefault(require("axios"));
const prettier_1 = __importDefault(require("prettier"));
const apiKeyUtils_1 = require("../../../lib/apiKeyUtils");
const constants_1 = require("../../../constants");
const fs_1 = require("fs");
const fs_2 = __importDefault(require("fs"));
const path = __importStar(require("path"));
const zlib = __importStar(require("zlib"));
const _ = __importStar(require("lodash"));
const merge_data_1 = require("../../../lib/setup/setup-theme/merge-data");
const setup_images_1 = require("../../../lib/setup/setup-theme/setup-images");
const publish_1 = require("../../../commands/publish");
async function update(themeOrPlugin, type, apiKey, frontendPath, isConfig) {
    return new Promise(async (resolve) => {
        let namespacePath = '';
        if (type === 'plugin' && themeOrPlugin.namespace) {
            namespacePath = `plugins/${themeOrPlugin.namespace}`;
        }
        // Path to the output file
        const outputPath = path.join(frontendPath, '.built', 'data.json');
        let combinedSectionPositionData = {};
        let updatedCombinedPluginData = {};
        if (themeOrPlugin &&
            themeOrPlugin.plugins &&
            themeOrPlugin.plugins.length) {
            updatedCombinedPluginData = await getCombinedPluginData(themeOrPlugin, apiKey, frontendPath, updatedCombinedPluginData, outputPath, namespacePath, combinedSectionPositionData, type, isConfig);
        }
        else {
            const { combinedData } = await (0, publish_1.getCombinedData)(false);
            let transformedData = await transformData(combinedData.data);
            const themeModulePagesFilePath = path.join(frontendPath, `/public/data/module-pages.json`);
            try {
                const themeModulePagesFileContent = await fs_1.promises.readFile(themeModulePagesFilePath, 'utf8');
                if (themeModulePagesFileContent) {
                    combinedSectionPositionData = transformSectionPositionData(JSON.parse(themeModulePagesFileContent));
                }
            }
            catch (error) {
                console.error(`Error: Unable to read theme file: ${themeModulePagesFilePath}`, error);
                process.exit(1);
            }
            const builtData = await createMergedData(themeOrPlugin, type, outputPath, transformedData, combinedSectionPositionData, isConfig, frontendPath);
            if (type === 'theme') {
                await updateCss(themeOrPlugin, builtData, type, namespacePath, frontendPath);
            }
            await (0, setup_images_1.updateImagesForThemeOrPlugin)(themeOrPlugin, frontendPath, builtData, type, isConfig);
        }
        return resolve();
    });
}
function getCombinedPluginData(themeOrPlugin, apiKey, frontendPath, updatedCombinedPluginData, outputPath, namespacePath, combinedSectionPositionData, type, isConfig) {
    return new Promise(async (resolve) => {
        if (!themeOrPlugin) {
            console.error('Error: No theme or plugin.');
            process.exit(1);
        }
        let language = themeOrPlugin.language
            ? themeOrPlugin.language
            : constants_1.Constants.defaults.LANGUAGE;
        const acceptedLanguages = ['javascript', 'typescript'];
        language =
            language && acceptedLanguages.includes(language)
                ? language
                : constants_1.Constants.defaults.LANGUAGE;
        const ext = `${language === 'javascript'
            ? 'jsx'
            : language === 'typescript'
                ? 'tsx'
                : constants_1.Constants.defaults.EXT}`;
        const themeModulePagesFilePath = path.join(frontendPath, `/public/data/module-pages.json`);
        let importsCode = '';
        let themeModulePagesFileContent = null;
        try {
            themeModulePagesFileContent = await fs_1.promises.readFile(themeModulePagesFilePath, 'utf8');
            if (themeModulePagesFileContent) {
                combinedSectionPositionData = transformSectionPositionData(JSON.parse(themeModulePagesFileContent));
            }
        }
        catch (error) {
            console.error(`Error: Unable to read theme file: ${themeModulePagesFilePath}`, error);
            process.exit(1);
        }
        const componentsPath = `${frontendPath}/components/${namespacePath}`;
        const builtLayoutFilePath = `${componentsPath}/_built/layout.${ext}`;
        let themeLayoutFileContent = '';
        let transformedThemeLayoutFileContent = '';
        try {
            themeLayoutFileContent = await fs_1.promises.readFile(`${componentsPath}/layout.${ext}`, 'utf8');
            if (!themeLayoutFileContent) {
                console.error(`Error: No theme layout file content: ${componentsPath}/layout.${ext}`);
                process.exit(1);
            }
            transformedThemeLayoutFileContent =
                getLayoutCode(themeLayoutFileContent) || '';
        }
        catch (error) {
            console.error(`Error: Unable to read theme layout file: ${componentsPath}/layout.${ext}`, error);
            process.exit(1);
        }
        if (!transformedThemeLayoutFileContent) {
            console.error(`Error: Theme layout file does not contain slots: ${componentsPath}/layout.${ext}`);
            process.exit(1);
        }
        setupPlugins(themeOrPlugin, apiKey)
            .then(async (results) => {
            fs_2.default.rmSync(path.join(frontendPath, 'public/data/plugins'), {
                recursive: true,
                force: true,
            });
            fs_2.default.rmSync(path.join(frontendPath, `components/plugins`), {
                recursive: true,
                force: true,
            });
            fs_2.default.rmSync(path.join(frontendPath, 'lib/plugins'), {
                recursive: true,
                force: true,
            });
            fs_2.default.rmSync(path.join(frontendPath, 'pages/api/plugins'), {
                recursive: true,
                force: true,
            });
            fs_2.default.rmSync(path.join(frontendPath, 'styles/plugins'), {
                recursive: true,
                force: true,
            });
            if (results &&
                results.successfulSetups &&
                results.successfulSetups.length) {
                // update plugins
                let { updatedThemeLayoutFileContent, updatedImportsCode, sectionPositionData, combinedPluginData, } = await transformPluginData(results, outputPath, frontendPath, ext, transformedThemeLayoutFileContent, importsCode);
                updatedCombinedPluginData = combinedPluginData;
                combinedSectionPositionData = _.merge({}, combinedSectionPositionData, sectionPositionData);
                combinedSectionPositionData = orderSections(combinedSectionPositionData);
                try {
                    let templateLayoutCode = getLayoutSectionSlotCode();
                    updatedThemeLayoutFileContent =
                        updatedThemeLayoutFileContent.replace('{/* children */}', templateLayoutCode);
                    // Define the regular expression to find the content between // content-slot and // end-content-slot
                    const contentSlotRegex = /(\/\/ content-slot[\s\S]*?\/\/ end-content-slot)/;
                    let updatedContent = themeLayoutFileContent.replace(contentSlotRegex, `// content-slot${updatedThemeLayoutFileContent}// end-content-slot`);
                    if (updatedImportsCode) {
                        updatedContent = updatedContent.replace('// end-import-slot', `${updatedImportsCode}\n// end-import-slot`);
                    }
                    const formattedCode = await prettier_1.default.format(updatedContent, {
                        parser: language,
                    });
                    const dir = path.dirname(builtLayoutFilePath);
                    await fs_1.promises.mkdir(dir, { recursive: true });
                    await fs_1.promises.writeFile(builtLayoutFilePath, formattedCode, null);
                    const builtData = await createMergedData(themeOrPlugin, type, outputPath, updatedCombinedPluginData, combinedSectionPositionData, isConfig, frontendPath);
                    if (!isConfig &&
                        themeOrPlugin.plugins &&
                        Array.isArray(themeOrPlugin.plugins)) {
                        await (0, setup_images_1.updateImagesForThemeOrPlugin)(themeOrPlugin, frontendPath, builtData, type, isConfig);
                    }
                    if (type === 'theme') {
                        await updateCss(themeOrPlugin, builtData, type, namespacePath, frontendPath);
                    }
                    return resolve(updatedCombinedPluginData);
                }
                catch (error) {
                    console.error('Error: Unable to build layout file.', error);
                    process.exit(1);
                }
            }
        })
            .catch(error => {
            console.error('An error occurred during setup:', error);
            process.exit(1);
        });
    });
}
async function updateCss(themeOrPlugin, builtData, type, namespacePath, frontendPath) {
    // update css
    let stylesPath = frontendPath
        ? `${frontendPath}/styles`
        : path.join(process.cwd(), `styles`);
    let cssPath = `${stylesPath}/globals.css`;
    let cssData;
    try {
        cssData = await fs_2.default.promises.readFile(cssPath, 'utf8');
        await processUpdateCss(cssData, builtData, themeOrPlugin, type, stylesPath, namespacePath, cssPath);
    }
    catch (error) { }
}
async function processUpdateCss(cssData, builtData, themeOrPlugin, type, stylesPath, namespacePath, cssPath) {
    if (cssData) {
        let cssString = ``;
        if (type === 'theme' && builtData.plugins) {
            const newPlugins = themeOrPlugin.plugins || [];
            const oldPlugins = builtData.plugins || [];
            // Remove old plugin imports and delete the directories
            for (let i = 0; i < oldPlugins.length; i++) {
                const oldPlugin = oldPlugins[i];
                if (!newPlugins.includes(oldPlugin)) {
                    // More flexible regex to match possible variations of the import statement
                    const pluginImportRegex = new RegExp(`@import\\s+['"]\\./plugins/${oldPlugin}/globals\\.css['"];\\s*`, 'g');
                    // Remove the import statement from the CSS data
                    cssData = cssData.replace(pluginImportRegex, '');
                    // Delete the plugin directory
                    const pluginDirPath = path.join(stylesPath, `plugins/${oldPlugin}`);
                    try {
                        await fs_2.default.promises.rmdir(pluginDirPath, { recursive: true });
                    }
                    catch (err) {
                        console.error(`Error deleting directory for ${oldPlugin}:`, err);
                    }
                }
            }
            // Add new plugin imports that don't already exist
            for (let i = 0; i < newPlugins.length; i++) {
                const plugin = newPlugins[i];
                if (!cssData.includes(`@import './plugins/${plugin}/globals.css`)) {
                    cssString += `@import './plugins/${plugin}/globals.css';\n`;
                }
            }
        }
        else if (type === 'plugin') {
            // Handle plugin case as in the original code
            if (!cssData.includes(`@import '${namespacePath}/globals.css`)) {
                cssString += `@import '${namespacePath}/globals.css';\n`;
            }
        }
        // cssString += `@import './globals.css';`;
        cssData = cssString + cssData; //cssData.replace(`@import './globals.css';`, cssString);
        // Write the updated CSS data back to css path
        await fs_1.promises.writeFile(cssPath, cssData);
    }
}
const transformSectionPositionData = (inputData) => {
    const outputData = {};
    inputData.modulePages.forEach(modulePage => {
        const pageName = modulePage.page.name;
        if (!outputData[pageName]) {
            outputData[pageName] = {};
        }
        modulePage.sections.forEach((section) => {
            outputData[pageName][section.name] = section.position;
        });
    });
    return outputData;
};
function getLayoutCode(code) {
    const contentRegex = /\/\/\s*content-slot([\s\S]*?)\/\/\s*end-content-slot/;
    const match = code.match(contentRegex);
    if (match) {
        let code = match[1];
        let startCommentIndex = code.indexOf('{/* section-slot */}');
        let endCommentIndex = code.indexOf('{/* end-section-slot */}') + 24; // include end comment
        if (!startCommentIndex || !endCommentIndex) {
            return null;
        }
        if (startCommentIndex !== -1 && endCommentIndex !== -1) {
            let before = code.slice(0, startCommentIndex);
            let after = code.slice(endCommentIndex);
            code = before + '{/* children */}' + after;
        }
        return code;
    }
    else {
        return null;
    }
}
async function setupPlugins(themeOrPlugin, apiKey) {
    if (themeOrPlugin) {
        if (!themeOrPlugin.plugins) {
            return null;
        }
        const plugins = themeOrPlugin.plugins;
        const requests = plugins.map(async (namespace) => {
            const url = `${constants_1.Constants.API_URL}/v${constants_1.Constants.CURRENT_API_VERSION}/themes/setup`;
            try {
                const response = await axios_1.default.post(url, { apiKey, namespace });
                return { namespace, data: response.data };
            }
            catch (error) {
                console.error(`Failed to setup plugin for namespace ${namespace}. Are you sure it exists?`);
                if (error.response) {
                    if (error.response.data.message) {
                        let msg = error.response.data.message;
                        // if (error.response.data.docsUrl) {
                        //   msg += `. Find out more at https://docs.builtjs.com/${error.response.data.docsUrl}.`;
                        // }
                        console.error(msg);
                        if (error.response.data.message === 'Invalid API key') {
                            apiKey = await (0, apiKeyUtils_1.promptForApiKey)();
                        }
                    }
                }
                process.exit(1);
            }
        });
        const results = await Promise.all(requests);
        const successfulSetups = results.filter(result => !result.error);
        const failedSetups = results.filter(result => result.error);
        return { successfulSetups, failedSetups };
    }
    else {
        console.error('This is not a theme (there is no theme.json file).');
        process.exit(1);
    }
}
async function transformPluginData(results, outputPath, srcDir, ext, transformedThemeLayoutFileContent, importsCode) {
    let combinedData = {
        collections: {},
        contentTypes: [],
        pages: [],
        sections: [],
        templates: [],
        layout: {
            contentIndex: 1,
            sections: [],
        },
        global: {},
        plugins: [],
    };
    let sectionPositionData = {};
    await Promise.all(results.successfulSetups.map(async (setup) => {
        if (setup.data.filesData && setup.data.layoutData) {
            const compressedBuffer = Buffer.from(setup.data.filesData.data);
            const decompressedData = await decompressData(compressedBuffer);
            if (decompressedData) {
                let data = JSON.parse(decompressedData.toString('utf-8'));
                let transformedData = await writePluginFiles(setup.namespace, data, outputPath, srcDir);
                combinedData = _.mergeWith({}, combinedData, transformedData, customizer);
                if (data.components[`plugins/${setup.namespace}/layout.${ext}`]) {
                    let pluginLayoutFileContent = data.components[`plugins/${setup.namespace}/layout.${ext}`];
                    const layoutImportsCode = getLayoutImportsCode(pluginLayoutFileContent);
                    let layoutCode = getLayoutCode(pluginLayoutFileContent) || '';
                    if (layoutCode) {
                        transformedThemeLayoutFileContent =
                            transformedThemeLayoutFileContent.replace('{/* children */}', layoutCode);
                    }
                    if (setup.data.layoutData.importsCode) {
                        importsCode += layoutImportsCode;
                    }
                }
                // Merge the results of transformSectionPositionData into sectionPositionData
                const transformedSectionPositionData = transformSectionPositionData(data.data[`module-pages.json`]);
                sectionPositionData = _.merge({}, sectionPositionData, transformedSectionPositionData);
            }
        }
    }));
    return {
        updatedThemeLayoutFileContent: transformedThemeLayoutFileContent,
        updatedImportsCode: importsCode,
        sectionPositionData: sectionPositionData,
        combinedPluginData: combinedData,
    };
}
async function decompressData(compressedData) {
    return new Promise((resolve, reject) => {
        zlib.gunzip(Buffer.from(compressedData), (err, buffer) => {
            if (err) {
                return reject(err);
            }
            resolve(buffer);
        });
    });
}
async function writePluginFiles(namespace, data, outputPath, srcDir) {
    let transformedData;
    const writeTasks = [];
    try {
        for (const [filePath, content] of Object.entries(data.components || {})) {
            // Ignore paths starting with 'components/ui'
            if (filePath.startsWith('ui/')) {
                continue;
            }
            const targetPath = path.join(srcDir, 'components', filePath);
            writeTasks.push(fs_1.promises
                .mkdir(path.dirname(targetPath), { recursive: true })
                .then(() => fs_1.promises.writeFile(targetPath, content)));
        }
        for (const [filePath, content] of Object.entries(data.api || {})) {
            const targetPath = path.join(srcDir, 'pages/api', filePath);
            writeTasks.push(fs_1.promises
                .mkdir(path.dirname(targetPath), { recursive: true })
                .then(() => fs_1.promises.writeFile(targetPath, content)));
        }
        for (const [filePath, content] of Object.entries(data.styles || {})) {
            if (filePath.startsWith('plugins')) {
                const targetPath = path.join(srcDir, 'styles', filePath);
                writeTasks.push(fs_1.promises
                    .mkdir(path.dirname(targetPath), { recursive: true })
                    .then(() => fs_1.promises.writeFile(targetPath, content)));
            }
        }
        for (const [filePath, content] of Object.entries(data.lib || {})) {
            const targetPath = path.join(srcDir, 'lib', filePath);
            if (!targetPath.includes('lib/builtjs-utils') &&
                !targetPath.includes('lib/theme/page')) {
                writeTasks.push(fs_1.promises
                    .mkdir(path.dirname(targetPath), { recursive: true })
                    .then(() => fs_1.promises.writeFile(targetPath, content)));
            }
        }
        for (const [filePath, content] of Object.entries(data.data || {})) {
            const targetPath = path.join(srcDir, 'public/data', `plugins/${namespace}`, filePath);
            if (filePath === 'sections.json' || filePath === 'templates.json') {
                // Get the key (sections or templates) dynamically
                const key = Object.keys(content)[0];
                // Ensure the key exists and content[key] is an array
                if (key && Array.isArray(content[key])) {
                    content[key] = content[key].map((item) => ({
                        ...item,
                        namespace, // Add the namespace property
                    }));
                    data[filePath] = content;
                }
            }
            writeTasks.push(fs_1.promises
                .mkdir(path.dirname(targetPath), { recursive: true })
                .then(() => fs_1.promises.writeFile(targetPath, JSON.stringify(content))));
        }
        await Promise.all(writeTasks);
        transformedData = transformData(data.data, namespace);
        return transformedData;
    }
    catch (error) {
        console.error(`Error while updating plugins.`, error);
        return null;
    }
}
function transformData(data, namespace) {
    const transformed = {
        collections: {},
        contentTypes: [],
        pages: [],
        sections: [],
        templates: [],
        layout: {
            contentIndex: 1,
            sections: [],
        },
        global: {},
        plugins: [],
    };
    for (const [key, value] of Object.entries(data)) {
        const newKey = toCamelCase(key.split('/').pop()?.replace('.json', '') || '');
        if (key.startsWith('collections') && value.data) {
            transformed.collections[newKey] = value.data;
        }
        else if (['contentTypes', 'pages', 'sections', 'templates'].includes(newKey)) {
            if (namespace &&
                (newKey === 'sections' ||
                    newKey === 'templates' ||
                    newKey === 'contentTypes') &&
                value[newKey]) {
                Object.keys(value[newKey]).forEach(name => {
                    value[newKey][name].namespace = namespace;
                });
                transformed[newKey] = value[newKey];
            }
            else {
                transformed[newKey] = value[newKey];
            }
        }
    }
    return transformed;
}
function getLayoutImportsCode(code) {
    // Define the regex pattern to match the import section
    const importRegex = /\/\/ import-slot\n([\s\S]*?)\/\/ end-import-slot\n/g;
    // Match and extract the import section
    const match = importRegex.exec(code);
    // Output the matched import statements if they exist
    if (match) {
        const importStatements = match[1].trim();
        return importStatements;
    }
    return null;
}
const customizer = (objValue, srcValue, key) => {
    if (_.isArray(objValue)) {
        // If the key is 'collections', ensure unique slugs for the merged arrays
        if (objValue[0] && objValue[0].slug) {
            const mergedArray = objValue.concat(srcValue);
            const uniqueBySlug = _.uniqBy(mergedArray, 'slug');
            return uniqueBySlug;
        }
        return objValue.concat(srcValue);
    }
    // Ensure unique entries in templates
    if (objValue &&
        srcValue &&
        _.isArray(objValue.templates) &&
        _.isArray(srcValue.templates)) {
        return {
            ...objValue,
            ...srcValue,
            templates: _.union(objValue.templates, srcValue.templates),
        };
    }
    // If the section exists in objValue, don't overwrite it
    if (key === 'sections' && objValue && srcValue) {
        return { ...srcValue, ...objValue };
    }
};
async function createMergedData(themeOrPlugin, type, outputPath, pluginsData, pageSections, isConfig, frontendPath) {
    return new Promise(async (resolve) => {
        const pagesPath = `${frontendPath ? `${frontendPath}/` : ''}pages`;
        const themeData = await getThemeData(type, frontendPath);
        themeData.plugins =
            type === 'theme' && themeOrPlugin.plugins ? themeOrPlugin.plugins : [];
        const mergedData = (0, merge_data_1.mergeData)(pluginsData, themeData);
        let updatedPages = themeData.pages;
        if (Object.keys(pluginsData).length > 0) {
            // Handle the merging of pages separately
            updatedPages = pluginsData.pages.map((pluginPage) => {
                const newPage = themeData.pages.find((page) => page.name === pluginPage.name);
                const positions = pageSections[pluginPage.name] || {};
                const demoSections = Object.keys(positions)
                    .map(name => ({ name }))
                    .sort((a, b) => positions[a.name] - positions[b.name]);
                return { ...pluginPage, ...newPage, demoSections };
            });
            await createPageFiles(pagesPath, pluginsData.pages);
        }
        else {
            updatedPages = themeData.pages.map((page) => {
                const positions = pageSections[page.name] || {};
                const demoSections = Object.keys(positions)
                    .map(name => ({ name }))
                    .sort((a, b) => positions[a.name] - positions[b.name]);
                page.demoSections = demoSections;
                return page;
            });
        }
        updatedPages = updatePages(themeData, updatedPages, pageSections);
        mergedData.pages = updatedPages;
        // Ensure collections data is properly merged
        if (!mergedData.collections) {
            mergedData.collections = {};
        }
        // Read collection data and merge
        const collectionsDir = path.join(isConfig ? 'config' : '', 'public/data', 'collections');
        const collectionFiles = await fs_1.promises.readdir(collectionsDir);
        for (const file of collectionFiles) {
            const collectionData = await readJsonFile(path.join(collectionsDir, file));
            const collectionName = _.camelCase(path.basename(file, path.extname(file)));
            const dataArray = collectionData.data || collectionData;
            if (!mergedData.collections[collectionName]) {
                mergedData.collections[collectionName] = [];
            }
            const existingIds = new Set(mergedData.collections[collectionName].map((item) => item.slug));
            const uniqueDataArray = dataArray.filter((item) => !existingIds.has(item.slug));
            mergedData.collections[collectionName] =
                mergedData.collections[collectionName].concat(uniqueDataArray);
        }
        const dir = path.dirname(outputPath);
        await fs_1.promises.mkdir(dir, { recursive: true });
        // Write the merged data back to _data.json
        await fs_1.promises.writeFile(outputPath, JSON.stringify(mergedData, null, 2), 'utf8');
        return resolve(mergedData);
    });
}
function getArticlePageCode(pageName, contentTypeName) {
    return `import { GetStaticPaths, GetStaticProps } from "next";
  import { withRouter } from "next/router";
  import { getConfig, fetchEntries } from "@builtjs/theme";
  import Page from "@/lib/theme/page";
  
  export default withRouter(Page);
  
  export const getStaticPaths: GetStaticPaths = async () => {
    const entryData:any = await fetchEntries('${contentTypeName}');
    return {
      paths:
        entryData.entries.map(
          (entry:any) => \`/${camelCaseToDash(contentTypeName)}/\${entry.slug}\`
        ) ?? [],
      fallback: false,
    };
  };
  
  export const getStaticProps: GetStaticProps = async ({params}) => {
    const config = await getConfig({pageName: '${pageName}'});
    config.params = params;
    return {
      props: { config }
    };
  };`;
}
function getPageCode(pageName) {
    return `import { withRouter } from "next/router";
  import { getConfig } from "@builtjs/theme";
  import Page from "@/lib/theme/page";
  
  export default withRouter(Page);
  
  export async function getStaticProps() {
    const config = await getConfig({
      pageName: '${pageName}'
    });
    return {
      props: { config }
    };
  }`;
}
function camelCaseToDash(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
async function createPageFiles(pagesPath, pages) {
    for (const page of pages) {
        const { name, contentType } = page;
        let filePath;
        let fileContent;
        if (contentType) {
            // Content type exists, create dynamic page under [slug] folder
            filePath = path.join(pagesPath, camelCaseToDash(contentType.name), '[slug].tsx');
            fileContent = getArticlePageCode(page.name, contentType.name);
        }
        else {
            // No content type, create file at the root of pages
            const kebabCaseName = _.kebabCase(name);
            filePath = path.join(pagesPath, `${kebabCaseName}.tsx`);
            fileContent = getPageCode(name);
        }
        try {
            // Ensure directory exists
            await fs_1.promises.mkdir(path.dirname(filePath), { recursive: true });
            // Write the file
            await fs_1.promises.writeFile(filePath, fileContent, 'utf8');
        }
        catch (error) {
            console.error(`Failed to create file: ${filePath}`, error);
        }
    }
}
const orderSections = (sections) => {
    const orderedSections = {};
    Object.keys(sections).forEach(section => {
        const positions = sections[section];
        orderedSections[section] = Object.keys(positions)
            .sort((a, b) => positions[a] - positions[b])
            .reduce((acc, key) => {
            acc[key] = positions[key];
            return acc;
        }, {});
    });
    return orderedSections;
};
async function getThemeData(type, frontendPath) {
    const dataPath = `${frontendPath ? `${frontendPath}/` : ''}public/data`;
    // Read data from other files
    const pagesData = await readJsonFile(path.join(dataPath, 'pages.json'));
    const contentTypesData = await readJsonFile(path.join(dataPath, 'schemas/content-types.json'));
    const sectionsData = await readJsonFile(path.join(dataPath, 'sections.json'));
    const templatesData = await readJsonFile(path.join(dataPath, 'templates.json'));
    let globalData = null;
    globalData = await readJsonFile(path.join(dataPath, 'global.json'));
    const layoutData = await readJsonFile(path.join(dataPath, 'layout.json'));
    const themeData = {
        contentTypes: contentTypesData.contentTypes || [],
        pages: pagesData.pages || [],
        sections: sectionsData.sections || [],
        templates: templatesData.templates || [],
        layout: layoutData.layout || {},
        collections: {},
        plugins: [],
    };
    if (globalData) {
        themeData.global = globalData.global ? globalData.global : {};
    }
    return themeData;
}
async function readJsonFile(filePath) {
    try {
        const data = await fs_1.promises.readFile(filePath, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        else {
            throw error;
        }
    }
}
function updatePages(themeData, mergedPages, pageSections) {
    if (!mergedPages) {
        return themeData.pages.map((page) => {
            updatePageDemoSections(page, pageSections);
            return page;
        });
    }
    return themeData.pages.reduce((acc, page) => {
        const pageExists = mergedPages.some(mergedPage => mergedPage.name === page.name);
        if (!pageExists) {
            updatePageDemoSections(page, pageSections);
            acc.push(page);
        }
        return acc;
    }, [...mergedPages]);
}
function updatePageDemoSections(page, pageSections) {
    if (!page.demoSections || page.demoSections.length === 0) {
        const positions = pageSections[page.name] || {};
        const demoSections = Object.keys(positions).map(name => ({ name }));
        page.demoSections = demoSections;
    }
}
function getLayoutSectionSlotCode() {
    return `{page &&
    layoutComps.length > 0 &&
    layoutComps.map((Section: any, i: number) => {
      return (
        <div key={i}>
          <Section content={page.layout.sections[i].content} />
          {i === page.layout.contentIndex - 1 && (
            <main id="main">{children}</main>
          )}
        </div>
      );
    })}`;
}
function toCamelCase(str) {
    return str.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase());
}
