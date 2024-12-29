import axios from 'axios';
import prettier from 'prettier';
import {promptForApiKey} from '../../../lib/apiKeyUtils';
import {Constants} from '../../../constants';
import {promises as fsp, open as fsOpen} from 'fs';
import fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import * as _ from 'lodash';
import {mergeData} from '../../../lib/setup/setup-theme/merge-data';
import {updateImagesForThemeOrPlugin} from '../../../lib/setup/setup-theme/setup-images';
import {getCombinedData} from '../../../commands/publish';
import {BuiltData, Page, Section, ThemeOrPlugin} from '../../../interfaces';

interface ThemeData {
  pages: Page[];
}

interface Sections {
  [section: string]: Positions;
}

interface Positions {
  [key: string]: number;
}

type DataFile = {
  data?: any[];
  global?: Record<string, any>;
  layout?: Record<string, any>;
  modulePages?: any[];
  modules?: any[];
  pages?: any[];
  plugin?: Record<string, any>;
  contentTypes?: any[];
  elements?: any[];
  sections?: Record<string, any>;
  templates?: any[];
};

interface SetupResult {
  namespace: string;
  data?: any;
  error?: any;
}

interface ModulePage {
  name: string;
  description: string;
  page: Page;
  sections: Section[];
}

interface InputData {
  modulePages: ModulePage[];
}

interface PageSectionData {
  [pageName: string]: {
    [sectionName: string]: number;
  };
}

interface UpdateOptions {
  type?: string;
  themeOrPlugin?: ThemeOrPlugin;
}

export async function update(
  themeOrPlugin: ThemeOrPlugin,
  type: string,
  apiKey: string,
  frontendPath: string,
  isConfig?: boolean,
) {
  return new Promise<void>(async resolve => {
    let namespacePath = '';
    if (type === 'plugin' && themeOrPlugin.namespace) {
      namespacePath = `plugins/${themeOrPlugin.namespace}`;
    }

    // Path to the output file
    const outputPath = path.join(
      frontendPath,
      'public/data/_built',
      'data.json',
    );
    let combinedSectionPositionData: PageSectionData = {};

    let updatedCombinedPluginData = {};
    if (
      themeOrPlugin &&
      themeOrPlugin.plugins &&
      themeOrPlugin.plugins.length
    ) {
      updatedCombinedPluginData = await getCombinedPluginData(
        themeOrPlugin,
        apiKey,
        frontendPath,
        updatedCombinedPluginData,
        outputPath,
        namespacePath,
        combinedSectionPositionData,
        type,
        isConfig,
      );
    } else {
      const {combinedData} = await getCombinedData(false);
      let transformedData = await transformData(combinedData.data);
      const themeModulePagesFilePath = path.join(
        frontendPath,
        `/public/data/module-pages.json`,
      );
      try {
        const themeModulePagesFileContent = await fsp.readFile(
          themeModulePagesFilePath,
          'utf8',
        );
        if (themeModulePagesFileContent) {
          combinedSectionPositionData = transformSectionPositionData(
            JSON.parse(themeModulePagesFileContent),
          );
        }
      } catch (error) {
        console.error(
          `Error: Unable to read theme file: ${themeModulePagesFilePath}`,
          error,
        );
        process.exit(1);
      }
      const builtData = await createMergedData(
        themeOrPlugin,
        type,
        outputPath,
        transformedData,
        combinedSectionPositionData,
        isConfig,
        frontendPath,
      );
      if (type === 'theme') {
        await updateCss(
          themeOrPlugin,
          builtData,
          type,
          namespacePath,
          frontendPath,
        );
      }

      await updateImagesForThemeOrPlugin(
        themeOrPlugin,
        frontendPath,
        builtData,
        type,
        isConfig,
      );
    }

    return resolve();
  });
}

function getCombinedPluginData(
  themeOrPlugin: ThemeOrPlugin,
  apiKey: string,
  frontendPath: string,
  updatedCombinedPluginData: any,
  outputPath: string,
  namespacePath: string,
  combinedSectionPositionData: PageSectionData,
  type: string,
  isConfig?: boolean,
): Promise<any> {
  return new Promise(async resolve => {
    if (!themeOrPlugin) {
      console.error('Error: No theme or plugin.');
      process.exit(1);
    }
    let language = themeOrPlugin.language
      ? themeOrPlugin.language
      : Constants.defaults.LANGUAGE;
    const acceptedLanguages = ['javascript', 'typescript'];
    language =
      language && acceptedLanguages.includes(language)
        ? language
        : Constants.defaults.LANGUAGE;
    const ext = `${
      language === 'javascript'
        ? 'jsx'
        : language === 'typescript'
          ? 'tsx'
          : Constants.defaults.EXT
    }`;
    const themeModulePagesFilePath = path.join(
      frontendPath,
      `/public/data/module-pages.json`,
    );
    let importsCode = '';

    let themeModulePagesFileContent: any = null;
    try {
      themeModulePagesFileContent = await fsp.readFile(
        themeModulePagesFilePath,
        'utf8',
      );
      if (themeModulePagesFileContent) {
        combinedSectionPositionData = transformSectionPositionData(
          JSON.parse(themeModulePagesFileContent),
        );
      }
    } catch (error) {
      console.error(
        `Error: Unable to read theme file: ${themeModulePagesFilePath}`,
        error,
      );
      process.exit(1);
    }
    const componentsPath = `${frontendPath}/components/${namespacePath}`;
    const builtLayoutFilePath = `${componentsPath}/_built/layout.${ext}`;
    let themeLayoutFileContent = '';
    let transformedThemeLayoutFileContent = '';
    try {
      themeLayoutFileContent = await fsp.readFile(
        `${componentsPath}/layout.${ext}`,
        'utf8',
      );
      if (!themeLayoutFileContent) {
        console.error(
          `Error: No theme layout file content: ${componentsPath}/layout.${ext}`,
        );
        process.exit(1);
      }
      transformedThemeLayoutFileContent =
        getLayoutCode(themeLayoutFileContent) || '';
    } catch (error) {
      console.error(
        `Error: Unable to read theme layout file: ${componentsPath}/layout.${ext}`,
        error,
      );
      process.exit(1);
    }
    if (!transformedThemeLayoutFileContent) {
      console.error(
        `Error: Theme layout file does not contain slots: ${componentsPath}/layout.${ext}`,
      );
      process.exit(1);
    }
    setupPlugins(themeOrPlugin, apiKey)
      .then(async results => {
        fs.rmSync(path.join(frontendPath, 'public/data/plugins'), {
          recursive: true,
          force: true,
        });
        fs.rmSync(path.join(frontendPath, `components/plugins`), {
          recursive: true,
          force: true,
        });
        fs.rmSync(path.join(frontendPath, 'lib/plugins'), {
          recursive: true,
          force: true,
        });
        fs.rmSync(path.join(frontendPath, 'pages/api/plugins'), {
          recursive: true,
          force: true,
        });
        fs.rmSync(path.join(frontendPath, 'styles/plugins'), {
          recursive: true,
          force: true,
        });
        if (
          results &&
          results.successfulSetups &&
          results.successfulSetups.length
        ) {
          // update plugins
          let {
            updatedThemeLayoutFileContent,
            updatedImportsCode,
            sectionPositionData,
            combinedPluginData,
          } = await transformPluginData(
            results,
            outputPath,
            frontendPath,
            ext,
            transformedThemeLayoutFileContent,
            importsCode,
          );
          updatedCombinedPluginData = combinedPluginData;
          combinedSectionPositionData = _.merge(
            {},
            combinedSectionPositionData,
            sectionPositionData,
          );
          combinedSectionPositionData = orderSections(
            combinedSectionPositionData,
          );
          try {
            let templateLayoutCode = getLayoutSectionSlotCode();
            updatedThemeLayoutFileContent =
              updatedThemeLayoutFileContent.replace(
                '{/* children */}',
                templateLayoutCode,
              );

            // Define the regular expression to find the content between // content-slot and // end-content-slot
            const contentSlotRegex =
              /(\/\/ content-slot[\s\S]*?\/\/ end-content-slot)/;

            let updatedContent = themeLayoutFileContent.replace(
              contentSlotRegex,
              `// content-slot${updatedThemeLayoutFileContent}// end-content-slot`,
            );

            if (updatedImportsCode) {
              updatedContent = updatedContent.replace(
                '// end-import-slot',
                `${updatedImportsCode}\n// end-import-slot`,
              );
            }

            const formattedCode = await prettier.format(updatedContent, {
              parser: language,
            });
            const dir = path.dirname(builtLayoutFilePath);
            await fsp.mkdir(dir, {recursive: true});
            await fsp.writeFile(builtLayoutFilePath, formattedCode, null);

            const builtData = await createMergedData(
              themeOrPlugin,
              type,
              outputPath,
              updatedCombinedPluginData,
              combinedSectionPositionData,
              isConfig,
              frontendPath,
            );

            if (
              !isConfig &&
              themeOrPlugin.plugins &&
              Array.isArray(themeOrPlugin.plugins)
            ) {
              await updateImagesForThemeOrPlugin(
                themeOrPlugin,
                frontendPath,
                builtData,
                type,
                isConfig,
              );
            }
            if (type === 'theme') {
              await updateCss(
                themeOrPlugin,
                builtData,
                type,
                namespacePath,
                frontendPath,
              );
            }

            return resolve(updatedCombinedPluginData);
          } catch (error) {
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

async function updateCss(
  themeOrPlugin: ThemeOrPlugin,
  builtData: BuiltData,
  type: string,
  namespacePath: string,
  frontendPath?: string,
) {
  // update css
  let stylesPath = frontendPath
    ? `${frontendPath}/styles`
    : path.join(process.cwd(), `styles`);
  let cssPath: string = `${stylesPath}/globals.css`;
  let cssData: string;
  try {
    cssData = await fs.promises.readFile(cssPath, 'utf8');
    await processUpdateCss(
      cssData,
      builtData,
      themeOrPlugin,
      type,
      stylesPath,
      namespacePath,
      cssPath,
    );
  } catch (error) {}
}

async function processUpdateCss(
  cssData: string,
  builtData: BuiltData,
  themeOrPlugin: ThemeOrPlugin,
  type: string,
  stylesPath: string,
  namespacePath: string,
  cssPath: string,
) {
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
          const pluginImportRegex = new RegExp(
            `@import\\s+['"]\\./plugins/${oldPlugin}/globals\\.css['"];\\s*`,
            'g',
          );

          // Remove the import statement from the CSS data
          cssData = cssData.replace(pluginImportRegex, '');

          // Delete the plugin directory
          const pluginDirPath = path.join(stylesPath, `plugins/${oldPlugin}`);

          try {
            await fs.promises.rmdir(pluginDirPath, {recursive: true});
          } catch (err) {
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
    } else if (type === 'plugin') {
      // Handle plugin case as in the original code
      if (!cssData.includes(`@import '${namespacePath}/globals.css`)) {
        cssString += `@import '${namespacePath}/globals.css';\n`;
      }
    }

    // cssString += `@import './globals.css';`;
    cssData = cssString + cssData; //cssData.replace(`@import './globals.css';`, cssString);

    // Write the updated CSS data back to css path
    await fsp.writeFile(cssPath, cssData);
  }
}

const transformSectionPositionData = (
  inputData: InputData,
): PageSectionData => {
  const outputData: PageSectionData = {};

  inputData.modulePages.forEach(modulePage => {
    const pageName = modulePage.page.name;

    if (!outputData[pageName]) {
      outputData[pageName] = {};
    }

    modulePage.sections.forEach((section: Section) => {
      outputData[pageName][section.name] = section.position;
    });
  });

  return outputData;
};

function getLayoutCode(code: string) {
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
  } else {
    return null;
  }
}

async function setupPlugins(
  themeOrPlugin: ThemeOrPlugin,
  apiKey: string,
): Promise<{
  successfulSetups: SetupResult[];
  failedSetups: SetupResult[];
} | null> {
  if (themeOrPlugin) {
    if (!themeOrPlugin.plugins) {
      return null;
    }
    const plugins = themeOrPlugin.plugins;

    const requests = plugins.map(async namespace => {
      const url = `${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/themes/setup`;

      try {
        const response = await axios.post(url, {apiKey, namespace});
        return {namespace, data: response.data};
      } catch (error: any) {
        console.error(
          `Failed to setup plugin for namespace ${namespace}. Are you sure it exists?`,
        );

        if (error.response) {
          if (error.response.data.message) {
            let msg = error.response.data.message;
            // if (error.response.data.docsUrl) {
            //   msg += `. Find out more at https://docs.builtjs.com/${error.response.data.docsUrl}.`;
            // }
            console.error(msg);
            if (error.response.data.message === 'Invalid API key') {
              apiKey = await promptForApiKey();
            }
          }
        }
        process.exit(1);
      }
    });

    const results: SetupResult[] = await Promise.all(requests);

    const successfulSetups = results.filter(result => !result.error);
    const failedSetups = results.filter(result => result.error);

    return {successfulSetups, failedSetups};
  } else {
    console.error('This is not a theme (there is no theme.json file).');
    process.exit(1);
  }
}

async function transformPluginData(
  results: {successfulSetups: SetupResult[]; failedSetups: SetupResult[]},
  outputPath: string,
  srcDir: string,
  ext: string,
  transformedThemeLayoutFileContent: string,
  importsCode: string,
): Promise<{
  updatedThemeLayoutFileContent: string;
  updatedImportsCode: string;
  sectionPositionData: any;
  combinedPluginData: any;
}> {
  let combinedData: BuiltData = {
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
  await Promise.all(
    results.successfulSetups.map(async (setup: SetupResult) => {
      if (setup.data.filesData && setup.data.layoutData) {
        const compressedBuffer = Buffer.from(setup.data.filesData.data);
        const decompressedData = await decompressData(compressedBuffer);
        if (decompressedData) {
          let data = JSON.parse(decompressedData.toString('utf-8'));
          let transformedData: BuiltData | null = await writePluginFiles(
            setup.namespace,
            data,
            outputPath,
            srcDir,
          );
          combinedData = _.mergeWith(
            {},
            combinedData,
            transformedData,
            customizer,
          );
          if (data.components[`plugins/${setup.namespace}/layout.${ext}`]) {
            let pluginLayoutFileContent: string =
              data.components[`plugins/${setup.namespace}/layout.${ext}`];

            const layoutImportsCode = getLayoutImportsCode(
              pluginLayoutFileContent,
            );
            let layoutCode = getLayoutCode(pluginLayoutFileContent) || '';
            if (layoutCode) {
              transformedThemeLayoutFileContent =
                transformedThemeLayoutFileContent.replace(
                  '{/* children */}',
                  layoutCode,
                );
            }
            if (setup.data.layoutData.importsCode) {
              importsCode += layoutImportsCode;
            }
          }
          // Merge the results of transformSectionPositionData into sectionPositionData
          const transformedSectionPositionData = transformSectionPositionData(
            data.data[`module-pages.json`],
          );
          sectionPositionData = _.merge(
            {},
            sectionPositionData,
            transformedSectionPositionData,
          );
        }
      }
    }),
  );
  return {
    updatedThemeLayoutFileContent: transformedThemeLayoutFileContent,
    updatedImportsCode: importsCode,
    sectionPositionData: sectionPositionData,
    combinedPluginData: combinedData,
  };
}

async function decompressData(compressedData: ArrayBuffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zlib.gunzip(Buffer.from(compressedData), (err, buffer) => {
      if (err) {
        return reject(err);
      }
      resolve(buffer);
    });
  });
}

async function writePluginFiles(
  namespace: string,
  data: any,
  outputPath: string,
  srcDir: string,
): Promise<BuiltData | null> {
  let transformedData: BuiltData;
  const writeTasks: Promise<void>[] = [];
  try {
    for (const [filePath, content] of Object.entries(data.components || {})) {
      // Ignore paths starting with 'components/ui'
      if (filePath.startsWith('ui/')) {
        continue;
      }
      const targetPath = path.join(srcDir, 'components', filePath);
      writeTasks.push(
        fsp
          .mkdir(path.dirname(targetPath), {recursive: true})
          .then(() => fsp.writeFile(targetPath, content as string)),
      );
    }

    for (const [filePath, content] of Object.entries(data.api || {})) {
      const targetPath = path.join(srcDir, 'pages/api', filePath);
      writeTasks.push(
        fsp
          .mkdir(path.dirname(targetPath), {recursive: true})
          .then(() => fsp.writeFile(targetPath, content as string)),
      );
    }

    for (const [filePath, content] of Object.entries(data.styles || {})) {
      if (filePath.startsWith('plugins')) {
        const targetPath = path.join(srcDir, 'styles', filePath);
        writeTasks.push(
          fsp
            .mkdir(path.dirname(targetPath), {recursive: true})
            .then(() => fsp.writeFile(targetPath, content as string)),
        );
      }
    }

    for (const [filePath, content] of Object.entries(data.lib || {})) {
      const targetPath = path.join(srcDir, 'lib', filePath);
      if (
        !targetPath.includes('lib/builtjs-utils') &&
        !targetPath.includes('lib/theme/page')
      ) {
        writeTasks.push(
          fsp
            .mkdir(path.dirname(targetPath), {recursive: true})
            .then(() => fsp.writeFile(targetPath, content as string)),
        );
      }
    }

    for (const [filePath, content] of Object.entries(data.data || {})) {
      const targetPath = path.join(
        srcDir,
        'public/data',
        `plugins/${namespace}`,
        filePath,
      );
      if (filePath === 'sections.json' || filePath === 'templates.json') {
        // Get the key (sections or templates) dynamically
        const key = Object.keys(content as any)[0];
        // Ensure the key exists and content[key] is an array
        if (key && Array.isArray((content as any)[key])) {
          (content as any)[key] = (content as any)[key].map((item: any) => ({
            ...item,
            namespace, // Add the namespace property
          }));
          data[filePath] = content;
        }
      }
      writeTasks.push(
        fsp
          .mkdir(path.dirname(targetPath), {recursive: true})
          .then(() => fsp.writeFile(targetPath, JSON.stringify(content))),
      );
    }
    await Promise.all(writeTasks);
    transformedData = transformData(data.data, namespace);
    return transformedData;
  } catch (error) {
    console.error(`Error while updating plugins.`, error);
    return null;
  }
}

export function transformData(
  data: Record<string, any>,
  namespace?: string,
): BuiltData {
  const transformed: BuiltData = {
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
    const newKey = toCamelCase(
      key.split('/').pop()?.replace('.json', '') || '',
    );
    if (key.startsWith('collections') && value.data) {
      transformed.collections[newKey] = value.data;
    } else if (
      ['contentTypes', 'pages', 'sections', 'templates'].includes(newKey)
    ) {
      if (
        namespace &&
        (newKey === 'sections' ||
          newKey === 'templates' ||
          newKey === 'contentTypes') &&
        value[newKey]
      ) {
        Object.keys(value[newKey]).forEach(name => {
          value[newKey]![name].namespace = namespace;
        });
        transformed[newKey as keyof BuiltData] = value[newKey] as any;
      } else {
        transformed[newKey as keyof BuiltData] = value[
          newKey as keyof DataFile
        ] as any;
      }
    }
  }
  return transformed;
}

function getLayoutImportsCode(code: string) {
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

const customizer = (objValue: any, srcValue: any, key: string) => {
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
  if (
    objValue &&
    srcValue &&
    _.isArray(objValue.templates) &&
    _.isArray(srcValue.templates)
  ) {
    return {
      ...objValue,
      ...srcValue,
      templates: _.union(objValue.templates, srcValue.templates),
    };
  }

  // If the section exists in objValue, don't overwrite it
  if (key === 'sections' && objValue && srcValue) {
    return {...srcValue, ...objValue};
  }
};

async function createMergedData(
  themeOrPlugin: ThemeOrPlugin,
  type: string,
  outputPath: string,
  pluginsData: any,
  pageSections: any,
  isConfig?: boolean,
  frontendPath?: string,
): Promise<BuiltData> {
  return new Promise(async resolve => {
    const pagesPath = `${frontendPath ? `${frontendPath}/` : ''}pages`;
    const themeData = await getThemeData(type, frontendPath);
    themeData.plugins =
      type === 'theme' && themeOrPlugin.plugins ? themeOrPlugin.plugins : [];
    const mergedData: BuiltData = mergeData(pluginsData, themeData);
    let updatedPages = themeData.pages;
    if (Object.keys(pluginsData).length > 0) {
      // Handle the merging of pages separately
      updatedPages = pluginsData.pages.map((pluginPage: Page) => {
        const newPage = themeData.pages.find(
          (page: Page) => page.name === pluginPage.name,
        );
        const positions = pageSections[pluginPage.name] || {};
        const demoSections = Object.keys(positions)
          .map(name => ({name}))
          .sort((a, b) => positions[a.name] - positions[b.name]);
        return {...pluginPage, ...newPage, demoSections};
      });

      await createPageFiles(pagesPath, pluginsData.pages);
    } else {
      updatedPages = themeData.pages.map((page: Page) => {
        const positions = pageSections[page.name] || {};
        const demoSections = Object.keys(positions)
          .map(name => ({name}))
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
    const collectionsDir = path.join(
      isConfig ? 'config' : '',
      'public/data',
      'collections',
    );

    const collectionFiles = await fsp.readdir(collectionsDir);
    for (const file of collectionFiles) {
      const collectionData = await readJsonFile(
        path.join(collectionsDir, file),
      );
      const collectionName = _.camelCase(
        path.basename(file, path.extname(file)),
      );
      const dataArray = collectionData.data || collectionData;

      if (!mergedData.collections[collectionName]) {
        mergedData.collections[collectionName] = [];
      }

      const existingIds = new Set(
        mergedData.collections[collectionName].map(
          (item: {slug: string}) => item.slug,
        ),
      );
      const uniqueDataArray = dataArray.filter(
        (item: {slug: string}) => !existingIds.has(item.slug),
      );
      mergedData.collections[collectionName] =
        mergedData.collections[collectionName].concat(uniqueDataArray);
    }

    const dir = path.dirname(outputPath);
    await fsp.mkdir(dir, {recursive: true});

    // Write the merged data back to _data.json
    await fsp.writeFile(
      outputPath,
      JSON.stringify(mergedData, null, 2),
      'utf8',
    );
    return resolve(mergedData);
  });
}

function getArticlePageCode(pageName: string, contentTypeName: string): string {
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

function getPageCode(pageName: string): string {
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

function camelCaseToDash(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

async function createPageFiles(
  pagesPath: string,
  pages: Array<{name: string; title: string; contentType?: {name: string}}>,
) {
  for (const page of pages) {
    const {name, contentType} = page;
    let filePath: string;
    let fileContent: string;

    if (contentType) {
      // Content type exists, create dynamic page under [slug] folder
      filePath = path.join(
        pagesPath,
        camelCaseToDash(contentType.name),
        '[slug].tsx',
      );
      fileContent = getArticlePageCode(page.name, contentType.name);
    } else {
      // No content type, create file at the root of pages
      const kebabCaseName = _.kebabCase(name);
      filePath = path.join(pagesPath, `${kebabCaseName}.tsx`);
      fileContent = getPageCode(name);
    }

    try {
      // Ensure directory exists
      await fsp.mkdir(path.dirname(filePath), {recursive: true});

      // Write the file
      await fsp.writeFile(filePath, fileContent, 'utf8');
    } catch (error) {
      console.error(`Failed to create file: ${filePath}`, error);
    }
  }
}

const orderSections = (sections: Sections): Sections => {
  const orderedSections: Sections = {};
  Object.keys(sections).forEach(section => {
    const positions = sections[section];
    orderedSections[section] = Object.keys(positions)
      .sort((a, b) => positions[a] - positions[b])
      .reduce((acc, key) => {
        acc[key] = positions[key];
        return acc;
      }, {} as Positions);
  });

  return orderedSections;
};

async function getThemeData(
  type: string,
  frontendPath?: string,
): Promise<BuiltData> {
  const dataPath = `${frontendPath ? `${frontendPath}/` : ''}public/data`;
  // Read data from other files
  const pagesData = await readJsonFile(path.join(dataPath, 'pages.json'));
  const contentTypesData = await readJsonFile(
    path.join(dataPath, 'schemas/content-types.json'),
  );
  const sectionsData = await readJsonFile(path.join(dataPath, 'sections.json'));
  const templatesData = await readJsonFile(
    path.join(dataPath, 'templates.json'),
  );
  let globalData = null;
  globalData = await readJsonFile(path.join(dataPath, 'global.json'));

  const layoutData = await readJsonFile(path.join(dataPath, 'layout.json'));

  const themeData: BuiltData = {
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

async function readJsonFile(filePath: string): Promise<any> {
  try {
    const data = await fsp.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {};
    } else {
      throw error;
    }
  }
}

function updatePages(
  themeData: ThemeData,
  mergedPages: Page[],
  pageSections: Record<string, number>,
): Page[] {
  if (!mergedPages) {
    return themeData.pages.map((page: Page) => {
      updatePageDemoSections(page, pageSections);
      return page;
    });
  }
  return themeData.pages.reduce(
    (acc, page) => {
      const pageExists = mergedPages.some(
        mergedPage => mergedPage.name === page.name,
      );
      if (!pageExists) {
        updatePageDemoSections(page, pageSections);
        acc.push(page);
      }

      return acc;
    },
    [...mergedPages],
  );
}

function updatePageDemoSections(
  page: Page,
  pageSections: Record<string, number>,
) {
  if (!page.demoSections || page.demoSections.length === 0) {
    const positions = pageSections[page.name] || {};
    const demoSections = Object.keys(positions).map(name => ({name}));
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

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase());
}
