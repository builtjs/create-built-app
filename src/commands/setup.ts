import axios from 'axios';
const prettier = require('prettier');
import {
  getApiKey,
  promptForApiKey,
  validateApiKey,
  saveApiKeyToConfig,
} from '../lib/apiKeyUtils';
import {Constants} from '../constants';
import {promises as fs} from 'fs';
import * as path from 'path';
import {getSrcDir} from '../utils';
import * as zlib from 'zlib';
import * as _ from 'lodash';
import {mergeData, Data, Page, Section} from '../lib/setup/merge-data';

interface Theme {
  language?: string;
  plugins: string[];
}

interface SetupResult {
  namespace: string;
  data?: any;
  error?: any;
}

async function isTheme(): Promise<Theme | null> {
  const themeFilePath = path.join(process.cwd(), 'public/data/theme.json');

  try {
    const data: string = await fs.readFile(themeFilePath, 'utf8');
    const parsedData = JSON.parse(data) as {theme: Theme};
    return parsedData.theme;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File does not exist
      return null;
    } else if (error instanceof SyntaxError) {
      // JSON parsing error
      console.error('Error parsing theme.json:', error);
      throw error;
    } else {
      // Some other error occurred
      throw error;
    }
  }
}

async function setupPlugins(
  theme: Theme,
  apiKey: string
): Promise<{
  successfulSetups: SetupResult[];
  failedSetups: SetupResult[];
} | null> {
  if (theme) {
    if (!theme.plugins) {
      return null;
    }
    const plugins = theme.plugins;

    const requests = plugins.map(async namespace => {
      const url = `${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/themes/setup`;

      try {
        const response = await axios.post(url, {apiKey, namespace});
        return {namespace, data: response.data};
      } catch (error: any) {
        console.error(`Failed to setup plugin for namespace ${namespace}:`);

        if (error.response) {
          if (error.response.data.message) {
            let msg = error.response.data.message;
            if (error.response.data.docsUrl) {
              msg += ` Find out more at ${error.response.data.docsUrl}.`;
            }
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

    if (successfulSetups.length > 0) {
      console.log('Plugins setup successfully:', successfulSetups);
    }

    return {successfulSetups, failedSetups};
  } else {
    console.log('This is not a theme (there is no theme.json file).');
    return null;
  }
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

async function setup() {
  let apiKey = await getApiKey();
  if (!apiKey) {
    console.error('Unable to process API key.');
    process.exit(1);
  }

  const isValid = await validateApiKey(apiKey);
  if (!isValid) {
    console.error('Invalid API key.');
    process.exit(1);
  }
  await saveApiKeyToConfig(apiKey);
  const theme = await isTheme();
  if (!theme) {
    console.error(
      `Error: Project needs to include a public/data/theme.json file.`
    );
    process.exit(1);
  }
  const srcDir = getSrcDir();
  let importsCode = '';
  let themeLayoutFileContent = '';
  let themeModulePagesFileContent: any = null;
  let combinedSectionPositionData: PageSectionData = {};
  let transformedThemeLayoutFileContent = '';
  const componentsPath = `${srcDir}/components`;
  let language = theme.language ? theme.language : Constants.defaults.LANGUAGE;
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
  const builtLayoutFilePath = `${componentsPath}/_built/layout.${ext}`;
  const themeModulePagesFilePath = path.join(
    process.cwd(),
    `public/data/module-pages.json`
  );
  // Path to the output file
  const outputPath = path.join('public/data/_built', 'data.json');

  try {
    themeLayoutFileContent = await fs.readFile(
      `${componentsPath}/layout.${ext}`,
      'utf8'
    );
    if (!themeLayoutFileContent) {
      console.error(
        `Error: No theme layout file content: ${componentsPath}/layout.${ext}`
      );
      process.exit(1);
    }
    transformedThemeLayoutFileContent =
      getLayoutCode(themeLayoutFileContent) || '';
  } catch (error) {
    console.error(
      `Error: Unable to read theme layout file: ${componentsPath}/layout.${ext}`,
      error
    );
    process.exit(1);
  }
  try {
    themeModulePagesFileContent = await fs.readFile(
      themeModulePagesFilePath,
      'utf8'
    );
    if (!themeModulePagesFileContent) {
      console.error(
        `Error: No theme layout file content: ${componentsPath}/layout.${ext}`
      );
      process.exit(1);
    }
    combinedSectionPositionData = transformSectionPositionData(
      JSON.parse(themeModulePagesFileContent)
    );
  } catch (error) {
    console.error(
      `Error: Unable to read theme file: ${themeModulePagesFilePath}`,
      error
    );
    process.exit(1);
  }
  if (!transformedThemeLayoutFileContent) {
    console.error(
      `Error: No theme layout file content: ${componentsPath}/layout.${ext}`
    );
    process.exit(1);
  }
  setupPlugins(theme, apiKey)
    .then(async results => {
      let updatedCombinedPluginData = {};
      if (
        results &&
        results.successfulSetups &&
        results.successfulSetups.length
      ) {
        let {
          updatedThemeLayoutFileContent,
          updatedImportsCode,
          sectionPositionData,
          combinedPluginData,
        } = await transformPluginData(
          results,
          outputPath,
          srcDir,
          ext,
          transformedThemeLayoutFileContent,
          importsCode
        );
        updatedCombinedPluginData = combinedPluginData;
        combinedSectionPositionData = _.merge(
          {},
          combinedSectionPositionData,
          sectionPositionData
        );
        combinedSectionPositionData = orderSections(
          combinedSectionPositionData
        );
        try {
          let templateLayoutCode = getLayoutSectionSlotCode();
          updatedThemeLayoutFileContent = updatedThemeLayoutFileContent.replace(
            '{/* children */}',
            templateLayoutCode
          );

          // Define the regular expression to find the content between // content-slot and // end-content-slot
          const contentSlotRegex =
            /(\/\/ content-slot[\s\S]*?\/\/ end-content-slot)/;

          let updatedContent = themeLayoutFileContent.replace(
            contentSlotRegex,
            `// content-slot${updatedThemeLayoutFileContent}// end-content-slot`
          );

          if (updatedImportsCode) {
            updatedContent = updatedContent.replace(
              '// end-import-slot',
              `${updatedImportsCode}\n// end-import-slot`
            );
          }

          const formattedCode = await prettier.format(updatedContent, {
            parser: language,
          });
          const dir = path.dirname(builtLayoutFilePath);

          await fs.mkdir(dir, {recursive: true});
          await fs.writeFile(builtLayoutFilePath, formattedCode, null);
        } catch (error) {
          console.error('Error: Unable to build layout file.', error);
        }
      }
      await createMergedData(
        outputPath,
        updatedCombinedPluginData,
        combinedSectionPositionData
      );
    })
    .catch(error => {
      console.error('An error occurred during setup:', error);
    });
}

interface Positions {
  [key: string]: number;
}

interface Sections {
  [section: string]: Positions;
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

const transformSectionPositionData = (
  inputData: InputData
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

const customizer = (objValue: any, srcValue: any, key: string) => {
  if (_.isArray(objValue)) {
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

async function transformPluginData(
  results: {successfulSetups: SetupResult[]; failedSetups: SetupResult[]},
  outputPath: string,
  srcDir: string,
  ext: string,
  transformedThemeLayoutFileContent: string,
  importsCode: string
): Promise<{
  updatedThemeLayoutFileContent: string;
  updatedImportsCode: string;
  sectionPositionData: any;
  combinedPluginData: any;
}> {
  let combinedData: Data = {
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
  };
  let sectionPositionData = {};
  await Promise.all(
    results.successfulSetups.map(async (setup: SetupResult) => {
      if (setup.data.filesData && setup.data.layoutData) {
        // Convert setup.data.filesData.data to Buffer before decompressing
        const compressedBuffer = Buffer.from(setup.data.filesData.data);
        const decompressedData = await decompressData(compressedBuffer);
        if (decompressedData) {
          let data = JSON.parse(decompressedData.toString('utf-8'));

          let transformedData: Data = await writePluginFiles(
            setup.namespace,
            data,
            outputPath,
            srcDir
          );

          combinedData = _.mergeWith(
            {},
            combinedData,
            transformedData,
            customizer
          );

          if (data.components[`plugins/${setup.namespace}/layout.${ext}`]) {
            let pluginLayoutFileContent: string =
              data.components[`plugins/${setup.namespace}/layout.${ext}`];

            const layoutImportsCode = getLayoutImportsCode(
              pluginLayoutFileContent
            );
            let layoutCode = getLayoutCode(pluginLayoutFileContent) || '';
            if (layoutCode) {
              transformedThemeLayoutFileContent =
                transformedThemeLayoutFileContent.replace(
                  '{/* children */}',
                  layoutCode
                );
            }
            if (setup.data.layoutData.importsCode) {
              importsCode += layoutImportsCode;
            }
          }
          sectionPositionData = transformSectionPositionData(
            data.data[`module-pages.json`]
          );
        }
      }
    })
  );

  return {
    updatedThemeLayoutFileContent: transformedThemeLayoutFileContent,
    updatedImportsCode: importsCode,
    sectionPositionData: sectionPositionData,
    combinedPluginData: combinedData,
  };
}

interface DataStructure {
  collections: Record<string, any[]>;
  pages: any[];
  contentTypes: any[];
  sections: any[];
  templates: any[];
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

async function readJsonFile(filePath: string): Promise<any> {
  try {
    const data = await fs.readFile(path.join(process.cwd(), filePath), 'utf8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {};
    } else {
      throw error;
    }
  }
}

async function getThemeData(): Promise<Data> {
  const dataPath = 'public/data';

  // Read data from other files
  const pagesData = await readJsonFile(path.join(dataPath, 'pages.json'));
  const contentTypesData = await readJsonFile(
    path.join(dataPath, 'schemas/content-types.json')
  );
  const sectionsData = await readJsonFile(path.join(dataPath, 'sections.json'));
  const templatesData = await readJsonFile(
    path.join(dataPath, 'templates.json')
  );
  const globalData = await readJsonFile(path.join(dataPath, 'global.json'));
  const layoutData = await readJsonFile(path.join(dataPath, 'layout.json'));

  const themeData: Data = {
    contentTypes: contentTypesData.contentTypes || [],
    pages: pagesData.pages || [],
    sections: sectionsData.sections || [],
    templates: templatesData.templates || [],
    layout: layoutData.layout || {},
    global: globalData.global || {},
    collections: {},
  };

  return themeData;
}

async function createMergedData(
  outputPath: string,
  pluginsData: any,
  pageSections: any
): Promise<void> {
  const dataPath = 'public/data';
  const themeData = await getThemeData();
  const mergedData: Data = mergeData(themeData, pluginsData);
  let updatedPages = themeData.pages;
  if (Object.keys(pluginsData).length > 0) {
    // Handle the merging of pages separately
    updatedPages = pluginsData.pages.map((existingPage: Page) => {
      const newPage = themeData.pages.find(
        (page: Page) => page.name === existingPage.name
      );
      if (newPage) {
        // Create demoSections based on sectionPositions
        const positions = pageSections[existingPage.name] || {};
        const demoSections = Object.keys(positions)
          .map(name => ({name}))
          .sort((a, b) => positions[a.name] - positions[b.name]);
        return {...existingPage, ...newPage, demoSections};
      }
      return existingPage;
    });
  }
  updatedPages = updatePages(themeData, updatedPages, pageSections);
  mergedData.pages = updatedPages;

  // Ensure collections data is properly merged
  if (!mergedData.collections) {
    mergedData.collections = {};
  }

  // Read collection data and merge
  const collectionsDir = path.join(dataPath, 'collections');
  const collectionFiles = await fs.readdir(collectionsDir);

  for (const file of collectionFiles) {
    const collectionData = await readJsonFile(path.join(collectionsDir, file));
    const collectionName = _.camelCase(path.basename(file, path.extname(file)));
    const dataArray = collectionData.data || collectionData;

    if (!mergedData.collections[collectionName]) {
      mergedData.collections[collectionName] = [];
    }

    mergedData.collections[collectionName] =
      mergedData.collections[collectionName].concat(dataArray);
  }
  const dir = path.dirname(outputPath);

  // Ensure the directory exists
  await fs.mkdir(dir, {recursive: true});
  // Write the merged data back to _data.json
  await fs.writeFile(outputPath, JSON.stringify(mergedData, null, 2), 'utf8');
}

interface ThemeData {
  pages: Page[];
}

function updatePages(
  themeData: ThemeData,
  mergedPages: Page[],
  pageSections: Record<string, number>
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
        mergedPage => mergedPage.name === page.name
      );

      if (!pageExists) {
        updatePageDemoSections(page, pageSections);
        acc.push(page);
      }

      return acc;
    },
    [...mergedPages]
  );
}

function updatePageDemoSections(
  page: Page,
  pageSections: Record<string, number>
) {
  if (!page.demoSections || page.demoSections.length === 0) {
    const positions = pageSections[page.name] || {};
    const demoSections = Object.keys(positions).map(name => ({name}));
    page.demoSections = demoSections;
  }
}

async function writePluginFiles(
  namespace: string,
  data: any,
  outputPath: string,
  srcDir: string
): Promise<Data> {
  const writeTasks: Promise<void>[] = [];

  for (const [filePath, content] of Object.entries(data.components || {})) {
    const targetPath = path.join(srcDir, 'components', filePath);

    writeTasks.push(
      fs
        .mkdir(path.dirname(targetPath), {recursive: true})
        .then(() => fs.writeFile(targetPath, content as string))
    );
  }

  for (const [filePath, content] of Object.entries(data.api || {})) {
    const targetPath = path.join(srcDir, 'pages/api', filePath);
    writeTasks.push(
      fs
        .mkdir(path.dirname(targetPath), {recursive: true})
        .then(() => fs.writeFile(targetPath, content as string))
    );
  }

  for (const [filePath, content] of Object.entries(data.styles || {})) {
    const targetPath = path.join(srcDir, 'styles', filePath);
    writeTasks.push(
      fs
        .mkdir(path.dirname(targetPath), {recursive: true})
        .then(() => fs.writeFile(targetPath, content as string))
    );
  }

  for (const [filePath, content] of Object.entries(data.lib || {})) {
    const targetPath = path.join(srcDir, 'lib', filePath);
    writeTasks.push(
      fs
        .mkdir(path.dirname(targetPath), {recursive: true})
        .then(() => fs.writeFile(targetPath, content as string))
    );
  }

  for (const [filePath, content] of Object.entries(data.data || {})) {
    const targetPath = path.join(
      'public/data',
      `plugins/${namespace}`,
      filePath
    );
    writeTasks.push(
      fs
        .mkdir(path.dirname(targetPath), {recursive: true})
        .then(() => fs.writeFile(targetPath, JSON.stringify(content)))
    );
  }

  await Promise.all(writeTasks);

  const transformedData: Data = transformData(data.data, namespace);
  return transformedData;
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

// Helper function to convert dashed names to camel case
function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (match, p1) => p1.toUpperCase());
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

function transformData(data: InputData, namespace: string): Data {
  const transformed: Data = {
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
  };

  for (const [key, value] of Object.entries(data)) {
    const newKey = toCamelCase(
      key.split('/').pop()?.replace('.json', '') || ''
    );

    if (key.startsWith('collections') && value.data) {
      transformed.collections[newKey] = value.data;
    } else if (
      ['contentTypes', 'pages', 'sections', 'templates'].includes(newKey)
    ) {
      if (newKey === 'sections' && value.sections) {
        Object.keys(value.sections).forEach(sectionName => {
          value.sections![sectionName].namespace = namespace;
        });
        transformed[newKey as keyof Data] = value.sections as any;
      } else {
        transformed[newKey as keyof Data] = value[
          newKey as keyof DataFile
        ] as any;
      }
    }
  }

  return transformed;
}

export {setup};
