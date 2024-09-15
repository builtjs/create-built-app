import axios from 'axios';
import prettier from 'prettier';
import {
  getApiKey,
  promptForApiKey,
  validateApiKey,
  saveApiKeyToConfig,
} from '../../../lib/apiKeyUtils';
import {Constants} from '../../../constants';
import {promises as fsp, open as fsOpen} from 'fs';
import fs from 'fs';
import * as path from 'path';
import {getSrcDir} from '../../../utils';
import * as zlib from 'zlib';
import * as _ from 'lodash';
import {
  mergeData,
  Data,
  Page,
  Section,
} from '../../../lib/setup/setup-theme/merge-data';
import {updateImagesForThemeOrPlugin} from '../../../lib/setup/setup-theme/setup-images';
import {setupSiteData} from '../../../lib/setup/setup-site/import-data/import-data';
import {getCombinedData} from '../../../commands/publish';
import {CombinedData} from '../../../interfaces';

interface ThemeOrPlugin {
  namespace: string;
  language?: string;
  plugins?: string[];
}

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

// export async function validateForUpdate({
//   type = '',
//   themeOrPlugin,
// }: UpdateOptions): Promise<void> {
//   return new Promise<void>(async resolve => {
//     console.log('updateThemeOrPlugin...')
//     if (!themeOrPlugin) {
//       console.error('Error: No theme or plugin.');
//       process.exit(1);
//     }
//     let apiKey = await getApiKey();
//     if (!apiKey) {
//       console.error('Unable to process API key.');
//       process.exit(1);
//     }

//     const isValid = await validateApiKey(apiKey);
//     if (!isValid) {
//       apiKey = await promptForApiKey();
//     }
//     await saveApiKeyToConfig(apiKey);
//     console.log(`Updating ${type}...`);
//     await update(themeOrPlugin, type, apiKey);
//     resolve();
//   });
// }

export async function update(
  themeOrPlugin: ThemeOrPlugin,
  type: string,
  apiKey: string,
  frontendPath: string,
  isConfig?: boolean
) {
  return new Promise<void>(async resolve => {
    console.log('update()...', type);
    // console.log({frontendPath})
    // // console.log('themeOrPlugin...', themeOrPlugin);
    // if (!themeOrPlugin) {
    //   console.error('Error: No theme or plugin.');
    //   process.exit(1);
    // }
    let namespacePath = '';
    if (type === 'plugin' && themeOrPlugin.namespace) {
      namespacePath = `plugins/${themeOrPlugin.namespace}`;
    }
    // // let configPath = isConfig ? 'config' : '';
    // const cwd = process.cwd();
    // let language = themeOrPlugin.language
    //   ? themeOrPlugin.language
    //   : Constants.defaults.LANGUAGE;
    // const acceptedLanguages = ['javascript', 'typescript'];
    // language =
    //   language && acceptedLanguages.includes(language)
    //     ? language
    //     : Constants.defaults.LANGUAGE;
    // const ext = `${
    //   language === 'javascript'
    //     ? 'jsx'
    //     : language === 'typescript'
    //       ? 'tsx'
    //       : Constants.defaults.EXT
    // }`;
    // const themeModulePagesFilePath = path.join(
    //   frontendPath,
    //   `/public/data/module-pages.json`
    // );
    // // Path to the output file
    const outputPath = path.join(
      frontendPath,
      'public/data/_built',
      'data.json'
    );
    // let importsCode = '';

    // let themeModulePagesFileContent: any = null;
    let combinedSectionPositionData: PageSectionData = {};
    // try {
    //   themeModulePagesFileContent = await fsp.readFile(
    //     themeModulePagesFilePath,
    //     'utf8'
    //   );
    //   if (themeModulePagesFileContent) {
    //     combinedSectionPositionData = transformSectionPositionData(
    //       JSON.parse(themeModulePagesFileContent)
    //     );
    //   }
    // } catch (error) {
    //   console.error(
    //     `Error: Unable to read theme file: ${themeModulePagesFilePath}`,
    //     error
    //   );
    //   process.exit(1);
    // }
    // const componentsPath = `${frontendPath}/components/${namespacePath}`;
    // console.log({componentsPath});
    // const builtLayoutFilePath = `${componentsPath}/_built/layout.${ext}`;
    // let themeLayoutFileContent = '';
    // let transformedThemeLayoutFileContent = '';
    // try {
    //   themeLayoutFileContent = await fsp.readFile(
    //     `${componentsPath}/layout.${ext}`,
    //     'utf8'
    //   );
    //   if (!themeLayoutFileContent) {
    //     console.error(
    //       `Error: No theme layout file content: ${componentsPath}/layout.${ext}`
    //     );
    //     process.exit(1);
    //   }
    //   transformedThemeLayoutFileContent =
    //     getLayoutCode(themeLayoutFileContent) || '';
    // } catch (error) {
    //   console.error(
    //     `Error: Unable to read theme layout file: ${componentsPath}/layout.${ext}`,
    //     error
    //   );
    //   process.exit(1);
    // }
    // if (!transformedThemeLayoutFileContent) {
    //   console.error(
    //     `Error: Theme layout file does not contain slots: ${componentsPath}/layout.${ext}`
    //   );
    //   process.exit(1);
    // }

    let updatedCombinedPluginData = {};
    const builtDataPath = path.join(
      frontendPath,
      `public/data/_built/data.json`
    );
    // const builtData = (await readJsonFile(builtDataPath)) as Data;
    if (
      themeOrPlugin &&
      themeOrPlugin.plugins &&
      themeOrPlugin.plugins.length
    ) {
      console.log(
        'themeOrPlugin && themeOrPlugin.plugins',
        themeOrPlugin.plugins
      );
      updatedCombinedPluginData = await getCombinedPluginData(
        themeOrPlugin,
        // builtData,
        apiKey,
        frontendPath,
        updatedCombinedPluginData,
        outputPath,
        namespacePath,
        combinedSectionPositionData,
        type,
        isConfig
      );
      // setupPlugins(themeOrPlugin, apiKey)
      //   .then(async results => {
      //     console.log({results});
      //     fs.rmSync(path.join(frontendPath, 'public/data/plugins'), {
      //       recursive: true,
      //       force: true,
      //     });
      //     fs.rmSync(path.join(frontendPath, `components/plugins`), {
      //       recursive: true,
      //       force: true,
      //     });
      //     fs.rmSync(path.join(frontendPath, 'lib/plugins'), {
      //       recursive: true,
      //       force: true,
      //     });
      //     fs.rmSync(path.join(frontendPath, 'pages/api/plugins'), {
      //       recursive: true,
      //       force: true,
      //     });
      //     fs.rmSync(path.join(frontendPath, 'styles/plugins'), {
      //       recursive: true,
      //       force: true,
      //     });
      //     if (
      //       results &&
      //       results.successfulSetups &&
      //       results.successfulSetups.length
      //     ) {
      //       console.log('Updating plugins...');

      //       let {
      //         updatedThemeLayoutFileContent,
      //         updatedImportsCode,
      //         sectionPositionData,
      //         combinedPluginData,
      //       } = await transformPluginData(
      //         results,
      //         outputPath,
      //         frontendPath,
      //         ext,
      //         transformedThemeLayoutFileContent,
      //         importsCode
      //       );
      //       updatedCombinedPluginData = combinedPluginData;
      //       combinedSectionPositionData = _.merge(
      //         {},
      //         combinedSectionPositionData,
      //         sectionPositionData
      //       );
      //       combinedSectionPositionData = orderSections(
      //         combinedSectionPositionData
      //       );
      //       try {
      //         let templateLayoutCode = getLayoutSectionSlotCode();
      //         updatedThemeLayoutFileContent =
      //           updatedThemeLayoutFileContent.replace(
      //             '{/* children */}',
      //             templateLayoutCode
      //           );

      //         // Define the regular expression to find the content between // content-slot and // end-content-slot
      //         const contentSlotRegex =
      //           /(\/\/ content-slot[\s\S]*?\/\/ end-content-slot)/;

      //         let updatedContent = themeLayoutFileContent.replace(
      //           contentSlotRegex,
      //           `// content-slot${updatedThemeLayoutFileContent}// end-content-slot`
      //         );

      //         if (updatedImportsCode) {
      //           updatedContent = updatedContent.replace(
      //             '// end-import-slot',
      //             `${updatedImportsCode}\n// end-import-slot`
      //           );
      //         }

      //         const formattedCode = await prettier.format(updatedContent, {
      //           parser: language,
      //         });
      //         const dir = path.dirname(builtLayoutFilePath);

      //         await fsp.mkdir(dir, {recursive: true});
      //         await fsp.writeFile(builtLayoutFilePath, formattedCode, null);

      //         await createMergedData(
      //           outputPath,
      //           updatedCombinedPluginData,
      //           combinedSectionPositionData,
      //           isConfig,
      //           frontendPath
      //         );
      //         if (
      //           !isConfig && themeOrPlugin.plugins &&
      //           Array.isArray(themeOrPlugin.plugins)
      //         ) {
      //           await updatePluginImagesForTheme(themeOrPlugin, frontendPath, type, isConfig);
      //         }

      //         await updateCss(themeOrPlugin, type, namespacePath, frontendPath);
      //         // // update index.css
      //         // // if(theme.plugins && theme.plugins.length){
      //         // let indexCssPath = frontendPath
      //         //   ? `${frontendPath}/styles${namespacePath}/index.css`
      //         //   : path.join(process.cwd(), `styles${namespacePath}/index.css`);

      //         // // const indexCssPath = `${frontendPath}/styles/index.css`;
      //         // let cssData: any = await fs.promises.readFile(
      //         //   indexCssPath,
      //         //   'utf8'
      //         // );
      //         // console.log({indexCssPath});
      //         // console.log({cssData});
      //         // if (cssData) {
      //         //   let cssString = ``;
      //         //   console.log({});
      //         //   if (type === 'theme' && themeOrPlugin.plugins) {
      //         //     for (let i = 0; i < themeOrPlugin.plugins.length; i++) {
      //         //       const plugin = themeOrPlugin.plugins[i];
      //         //       if (
      //         //         !cssData.includes(`@import 'plugins/${plugin}/index.css`)
      //         //       ) {
      //         //         cssString += `@import 'plugins/${plugin}/index.css';\n`;
      //         //       }
      //         //     }
      //         //   }
      //         //   cssString += `@import 'globals.css';`;
      //         //   console.log({cssString});
      //         //   cssData = cssData.replace(`@import 'globals.css';`, cssString);
      //         //   console.log('updated css data', cssData);
      //         //   await fs.promises.writeFile(indexCssPath, cssData);
      //         // }

      //       } catch (error) {
      //         console.error('Error: Unable to build layout file.', error);
      //         process.exit(1);
      //       }
      //     }
      //     // else {
      //       const {combinedData, type} = await getCombinedData(false);
      //       let transformedData = await transformData(combinedData.data);
      //       console.log({updatedCombinedPluginData})
      //       await createMergedData(
      //         outputPath,
      //         transformedData,
      //         combinedSectionPositionData,
      //         isConfig,
      //         frontendPath
      //       );
      //       // return resolve();
      //     // }
      //   })
      //   .catch(error => {
      //     console.error('An error occurred during setup:', error);
      //     process.exit(1);
      //   });
    } else {
      const {combinedData} = await getCombinedData(false);
      let transformedData = await transformData(combinedData.data);
      const themeModulePagesFilePath = path.join(
        frontendPath,
        `/public/data/module-pages.json`
      );
      try {
        const themeModulePagesFileContent = await fsp.readFile(
          themeModulePagesFilePath,
          'utf8'
        );
        if (themeModulePagesFileContent) {
          combinedSectionPositionData = transformSectionPositionData(
            JSON.parse(themeModulePagesFileContent)
          );
        }
      } catch (error) {
        console.error(
          `Error: Unable to read theme file: ${themeModulePagesFilePath}`,
          error
        );
        process.exit(1);
      }
      console.log({updatedCombinedPluginData});
      const builtData = await createMergedData(
        themeOrPlugin,
        type,
        outputPath,
        transformedData,
        combinedSectionPositionData,
        isConfig,
        frontendPath
      );

      await updateCss(
        themeOrPlugin,
        builtData,
        type,
        namespacePath,
        frontendPath
      );
      // if(!isConfig){
      await updateImagesForThemeOrPlugin(
        themeOrPlugin,
        frontendPath,
        builtData,
        type,
        isConfig
      );
    }

    // }
    return resolve();
  });
}

function getCombinedPluginData(
  themeOrPlugin: ThemeOrPlugin,
  // builtData: Data,
  apiKey: string,
  frontendPath: string,
  updatedCombinedPluginData: any,
  outputPath: string,
  namespacePath: string,
  combinedSectionPositionData: PageSectionData,
  type: string,
  isConfig?: boolean
): Promise<any> {
  return new Promise(async resolve => {
    console.log('update()...', type);
    console.log({frontendPath});
    // console.log('themeOrPlugin...', themeOrPlugin);
    if (!themeOrPlugin) {
      console.error('Error: No theme or plugin.');
      process.exit(1);
    }
    // let namespacePath = '';
    // if (type === 'plugin' && themeOrPlugin.namespace) {
    //   namespacePath = `plugins/${themeOrPlugin.namespace}`;
    // }
    // let configPath = isConfig ? 'config' : '';
    const cwd = process.cwd();
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
      `/public/data/module-pages.json`
    );
    // Path to the output file
    // const outputPath = path.join(frontendPath, 'public/data/_built', 'data.json');
    let importsCode = '';

    let themeModulePagesFileContent: any = null;
    // let combinedSectionPositionData: PageSectionData = {};
    try {
      themeModulePagesFileContent = await fsp.readFile(
        themeModulePagesFilePath,
        'utf8'
      );
      if (themeModulePagesFileContent) {
        combinedSectionPositionData = transformSectionPositionData(
          JSON.parse(themeModulePagesFileContent)
        );
      }
    } catch (error) {
      console.error(
        `Error: Unable to read theme file: ${themeModulePagesFilePath}`,
        error
      );
      process.exit(1);
    }
    const componentsPath = `${frontendPath}/components/${namespacePath}`;
    console.log({componentsPath});
    const builtLayoutFilePath = `${componentsPath}/_built/layout.${ext}`;
    let themeLayoutFileContent = '';
    let transformedThemeLayoutFileContent = '';
    try {
      themeLayoutFileContent = await fsp.readFile(
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
    if (!transformedThemeLayoutFileContent) {
      console.error(
        `Error: Theme layout file does not contain slots: ${componentsPath}/layout.${ext}`
      );
      process.exit(1);
    }
    setupPlugins(themeOrPlugin, apiKey)
      .then(async results => {
        console.log({results});
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
          console.log('Updating plugins...');

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
            updatedThemeLayoutFileContent =
              updatedThemeLayoutFileContent.replace(
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

            await fsp.mkdir(dir, {recursive: true});
            await fsp.writeFile(builtLayoutFilePath, formattedCode, null);

            const builtData = await createMergedData(
              themeOrPlugin,
              type,
              outputPath,
              updatedCombinedPluginData,
              combinedSectionPositionData,
              isConfig,
              frontendPath
            );
            console.log('updateImagesForThemeOrPlugin...isConfig', isConfig);
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
                isConfig
              );
            }

            await updateCss(
              themeOrPlugin,
              builtData,
              type,
              namespacePath,
              frontendPath
            );
            return resolve(updatedCombinedPluginData);
            // // update index.css
            // // if(theme.plugins && theme.plugins.length){
            // let indexCssPath = frontendPath
            //   ? `${frontendPath}/styles${namespacePath}/index.css`
            //   : path.join(process.cwd(), `styles${namespacePath}/index.css`);

            // // const indexCssPath = `${frontendPath}/styles/index.css`;
            // let cssData: any = await fs.promises.readFile(
            //   indexCssPath,
            //   'utf8'
            // );
            // console.log({indexCssPath});
            // console.log({cssData});
            // if (cssData) {
            //   let cssString = ``;
            //   console.log({});
            //   if (type === 'theme' && themeOrPlugin.plugins) {
            //     for (let i = 0; i < themeOrPlugin.plugins.length; i++) {
            //       const plugin = themeOrPlugin.plugins[i];
            //       if (
            //         !cssData.includes(`@import 'plugins/${plugin}/index.css`)
            //       ) {
            //         cssString += `@import 'plugins/${plugin}/index.css';\n`;
            //       }
            //     }
            //   }
            //   cssString += `@import 'globals.css';`;
            //   console.log({cssString});
            //   cssData = cssData.replace(`@import 'globals.css';`, cssString);
            //   console.log('updated css data', cssData);
            //   await fs.promises.writeFile(indexCssPath, cssData);
            // }
          } catch (error) {
            console.error('Error: Unable to build layout file.', error);
            process.exit(1);
          }
        }
        // else {
        // const {combinedData, type} = await getCombinedData(false);
        // let transformedData = await transformData(combinedData.data);
        // console.log({updatedCombinedPluginData})
        // await createMergedData(
        //   outputPath,
        //   transformedData,
        //   combinedSectionPositionData,
        //   isConfig,
        //   frontendPath
        // );
        // return resolve();
        // }
      })
      .catch(error => {
        console.error('An error occurred during setup:', error);
        process.exit(1);
      });
  });
}

// async function updateCss(
//   themeOrPlugin: ThemeOrPlugin,
//   builtData: Data,
//   type: string,
//   namespacePath: string,
//   frontendPath?: string
// ) {
//   // update index.css
//   // if(theme.plugins && theme.plugins.length){
//   let indexCssPath = frontendPath
//     ? `${frontendPath}/styles/index.css`
//     : path.join(process.cwd(), `styles/index.css`);

//   // const indexCssPath = `${frontendPath}/styles/index.css`;
//   let cssData: any = await fs.promises.readFile(indexCssPath, 'utf8');
//   console.log(path.join(process.cwd(), indexCssPath));
//   if (cssData) {
//     let cssString = ``;
//     if (type === 'theme' && themeOrPlugin.plugins) {
//       for (let i = 0; i < themeOrPlugin.plugins.length; i++) {
//         const plugin = themeOrPlugin.plugins[i];
//         if (!cssData.includes(`@import 'plugins/${plugin}/index.css`)) {
//           cssString += `@import 'plugins/${plugin}/index.css';\n`;
//         }
//       }
//     } else if (type === 'plugin') {
//       if (!cssData.includes(`@import '${namespacePath}/index.css`)) {
//         cssString += `@import '${namespacePath}/index.css';\n`;
//       }
//     }
//     cssString += `@import 'globals.css';`;
//     cssData = cssData.replace(`@import 'globals.css';`, cssString);

//     try {
//       await fsp.writeFile(path.join(process.cwd(), indexCssPath), cssData);
//       console.log('File successfully written!');
//     } catch (error) {
//       console.error('Error writing file:', error);
//     }
//   }
// }

// async function updateCss(
//   themeOrPlugin: ThemeOrPlugin,
//   builtData: Data,
//   type: string,
//   namespacePath: string,
//   frontendPath?: string
// ) {
//   // update index.css
//   let indexCssPath = frontendPath
//     ? `${frontendPath}/styles/index.css`
//     : path.join(process.cwd(), `styles/index.css`);

//   try {
//     let cssData: string = await fs.promises.readFile(indexCssPath, 'utf8');

//     if (cssData) {
//       console.log('Current CSS data:', cssData); // Log current css data
//       let cssString = ``;

//       // Only proceed if we're dealing with a theme and plugins exist
//       if (type === 'theme' && builtData.plugins) {
//         const newPlugins = themeOrPlugin.plugins || [];
//         const oldPlugins = builtData.plugins || [];

//         // Log both old and new plugins for verification
//         console.log('Old plugins:', oldPlugins);
//         console.log('New plugins:', newPlugins);

//         // Remove old plugin imports
//         for (let i = 0; i < oldPlugins.length; i++) {
//           const oldPlugin = oldPlugins[i];

//           if (!newPlugins.includes(oldPlugin)) {
//             console.log(`Removing plugin: ${oldPlugin}`);

//             // More flexible regex to match possible variations of the import statement
//             const pluginImportRegex = new RegExp(
//               `@import\\s+['"]\\./plugins/${oldPlugin}/index\\.css['"];\\s*`,
//               'g'
//             );

//             // Log the regex to ensure it is correct
//             console.log('Regex used:', pluginImportRegex);

//             // Replace the old plugin imports
//             cssData = cssData.replace(pluginImportRegex, '');
//           }
//         }

//         // Add new plugin imports that don't already exist
//         for (let i = 0; i < newPlugins.length; i++) {
//           const plugin = newPlugins[i];
//           if (!cssData.includes(`@import './plugins/${plugin}/index.css`)) {
//             cssString += `@import './plugins/${plugin}/index.css';\n`;
//           }
//         }
//       } else if (type === 'plugin') {
//         // Handle plugin case as in the original code
//         if (!cssData.includes(`@import '${namespacePath}/index.css`)) {
//           cssString += `@import '${namespacePath}/index.css';\n`;
//         }
//       }

//       // Ensure 'globals.css' is always imported
//       cssString += `@import './globals.css';`;
//       cssData = cssData.replace(`@import './globals.css';`, cssString);

//       console.log('Final CSS data:', cssData); // Log final css data

//       // Write the updated CSS data back to index.css
//       await fsp.writeFile(indexCssPath, cssData);
//       console.log('File successfully written!');
//     }
//   } catch (error) {
//     console.error('Error reading or writing file:', error);
//   }
// }

async function updateCss(
  themeOrPlugin: ThemeOrPlugin,
  builtData: Data,
  type: string,
  namespacePath: string,
  frontendPath?: string
) {
  // update index.css
  let stylesPath = frontendPath
    ? `${frontendPath}/styles`
    : path.join(process.cwd(), `styles`);
  let indexCssPath = `${stylesPath}/index.css`;
  try {
    let cssData: string = await fs.promises.readFile(indexCssPath, 'utf8');

    if (cssData) {
      console.log('Current CSS data:', cssData);
      let cssString = ``;

      if (type === 'theme' && builtData.plugins) {
        const newPlugins = themeOrPlugin.plugins || [];
        const oldPlugins = builtData.plugins || [];

        console.log('Old plugins:', oldPlugins);
        console.log('New plugins:', newPlugins);

        // Remove old plugin imports and delete the directories
        for (let i = 0; i < oldPlugins.length; i++) {
          const oldPlugin = oldPlugins[i];

          if (!newPlugins.includes(oldPlugin)) {
            console.log(`Removing plugin: ${oldPlugin}`);

            // More flexible regex to match possible variations of the import statement
            const pluginImportRegex = new RegExp(
              `@import\\s+['"]\\./plugins/${oldPlugin}/index\\.css['"];\\s*`,
              'g'
            );

            console.log('Regex used:', pluginImportRegex);

            // Remove the import statement from the CSS data
            cssData = cssData.replace(pluginImportRegex, '');

            // Delete the plugin directory
            const pluginDirPath = path.join(stylesPath, `plugins/${oldPlugin}`);
            console.log(`Deleting plugin directory: ${pluginDirPath}`);

            try {
              await fs.promises.rmdir(pluginDirPath, {recursive: true});
              console.log(`Successfully deleted directory for ${oldPlugin}`);
            } catch (err) {
              console.error(`Error deleting directory for ${oldPlugin}:`, err);
            }
          }
        }

        // Add new plugin imports that don't already exist
        for (let i = 0; i < newPlugins.length; i++) {
          const plugin = newPlugins[i];
          if (!cssData.includes(`@import './plugins/${plugin}/index.css`)) {
            cssString += `@import './plugins/${plugin}/index.css';\n`;
          }
        }
      } else if (type === 'plugin') {
        // Handle plugin case as in the original code
        if (!cssData.includes(`@import '${namespacePath}/index.css`)) {
          cssString += `@import '${namespacePath}/index.css';\n`;
        }
      }

      cssString += `@import './globals.css';`;
      cssData = cssData.replace(`@import './globals.css';`, cssString);

      console.log('Final CSS data:', cssData);

      // Write the updated CSS data back to index.css
      await fsp.writeFile(indexCssPath, cssData);
      console.log('File successfully written!');
    }
  } catch (error) {
    console.error('Error reading or writing file:', error);
  }
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
  apiKey: string
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
        console.error(`Failed to setup plugin for namespace ${namespace}.`);

        if (error.response) {
          if (error.response.data.message) {
            let msg = error.response.data.message;
            if (error.response.data.docsUrl) {
              msg += `. Find out more at https://docs.builtjs.com/${error.response.data.docsUrl}.`;
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

    return {successfulSetups, failedSetups};
  } else {
    console.log('This is not a theme (there is no theme.json file).');
    return null;
  }
}

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
    plugins: [],
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

          let transformedData: Data | null = await writePluginFiles(
            setup.namespace,
            data,
            outputPath,
            srcDir
          );
          // console.log({transformedData})
          // console.log({combinedData})
          combinedData = _.mergeWith(
            {},
            combinedData,
            transformedData,
            customizer
          );
          // console.log('combined data after mergewith', combinedData)
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
  srcDir: string
): Promise<Data | null> {
  let transformedData: Data;
  const writeTasks: Promise<void>[] = [];
  try {
    for (const [filePath, content] of Object.entries(data.components || {})) {
      const targetPath = path.join(srcDir, 'components', filePath);
      // console.log({targetPath})
      writeTasks.push(
        fsp
          .mkdir(path.dirname(targetPath), {recursive: true})
          .then(() => fsp.writeFile(targetPath, content as string))
      );
    }

    for (const [filePath, content] of Object.entries(data.api || {})) {
      const targetPath = path.join(srcDir, 'pages/api', filePath);
      writeTasks.push(
        fsp
          .mkdir(path.dirname(targetPath), {recursive: true})
          .then(() => fsp.writeFile(targetPath, content as string))
      );
    }

    for (const [filePath, content] of Object.entries(data.styles || {})) {
      console.log({filePath});
      if (filePath.startsWith('plugins')) {
        const targetPath = path.join(srcDir, 'styles', filePath);
        writeTasks.push(
          fsp
            .mkdir(path.dirname(targetPath), {recursive: true})
            .then(() => fsp.writeFile(targetPath, content as string))
        );
      }
    }

    for (const [filePath, content] of Object.entries(data.lib || {})) {
      const targetPath = path.join(srcDir, 'lib', filePath);
      writeTasks.push(
        fsp
          .mkdir(path.dirname(targetPath), {recursive: true})
          .then(() => fsp.writeFile(targetPath, content as string))
      );
    }

    for (const [filePath, content] of Object.entries(data.data || {})) {
      const targetPath = path.join(
        srcDir,
        'public/data',
        `plugins/${namespace}`,
        filePath
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
          .then(() => fsp.writeFile(targetPath, JSON.stringify(content)))
      );
    }
    await Promise.all(writeTasks);
    // console.log('transformData...')
    transformedData = transformData(data.data, namespace);
    return transformedData;
  } catch (error) {
    console.error(`Error while updating plugins.`, error);
    return null;
  }
}

export function transformData(
  data: Record<string, any>,
  namespace?: string
): Data {
  console.log('transformData...', namespace);
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
    plugins: [],
  };
  for (const [key, value] of Object.entries(data)) {
    const newKey = toCamelCase(
      key.split('/').pop()?.replace('.json', '') || ''
    );
    console.log('key--->', key);
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
        transformed[newKey as keyof Data] = value[newKey] as any;
      } else {
        transformed[newKey as keyof Data] = value[
          newKey as keyof DataFile
        ] as any;
      }
    }
  }
  // console.log({transformed})
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
  frontendPath?: string
): Promise<Data> {
  return new Promise(async resolve => {
    const dataPath = `${frontendPath ? `${frontendPath}/` : ''}public/data`;
    console.log({dataPath});
    const themeData = await getThemeData(frontendPath);
    themeData.plugins =
      type === 'theme' && themeOrPlugin.plugins ? themeOrPlugin.plugins : [];
    console.log({themeData});
    console.log({pluginsData});
    const mergedData: Data = mergeData(themeData, pluginsData);
    console.log({mergedData});
    let updatedPages = themeData.pages;
    console.log(
      'Object.keys(pluginsData).length',
      Object.keys(pluginsData).length
    );
    console.log({pageSections});
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
    } else {
      updatedPages = themeData.pages.map((page: Page) => {
        const positions = pageSections[page.name] || {};
        console.log({positions});
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
      'collections'
    );

    const collectionFiles = await fsp.readdir(collectionsDir);
    console.log('collectionsFiles length--->', collectionsDir);
    // for (const file of collectionFiles) {
    //   const collectionData = await readJsonFile(path.join(collectionsDir, file));
    //   const collectionName = _.camelCase(path.basename(file, path.extname(file)));
    //   console.log('collectionsName--->', collectionName);
    //   const dataArray = collectionData.data || collectionData;
    //   if (!mergedData.collections[collectionName]) {
    //     mergedData.collections[collectionName] = [];
    //   }

    //   mergedData.collections[collectionName] =
    //     mergedData.collections[collectionName].concat(dataArray);
    // }

    for (const file of collectionFiles) {
      const collectionData = await readJsonFile(
        path.join(collectionsDir, file)
      );
      const collectionName = _.camelCase(
        path.basename(file, path.extname(file))
      );
      console.log('collectionsName--->', collectionName);
      const dataArray = collectionData.data || collectionData;

      if (!mergedData.collections[collectionName]) {
        mergedData.collections[collectionName] = [];
      }

      const existingIds = new Set(
        mergedData.collections[collectionName].map(
          (item: {_id: string}) => item._id
        )
      );

      const uniqueDataArray = dataArray.filter(
        (item: {_id: string}) => !existingIds.has(item._id)
      );

      mergedData.collections[collectionName] =
        mergedData.collections[collectionName].concat(uniqueDataArray);
    }

    const dir = path.dirname(outputPath);
    // console.log('mkdir1', dir)
    // Ensure the directory exists
    await fsp.mkdir(dir, {recursive: true});
    // console.log('mergedData--->', mergedData);
    // console.log('endmkdir1', dir)
    // Write the merged data back to _data.json
    await fsp.writeFile(
      outputPath,
      JSON.stringify(mergedData, null, 2),
      'utf8'
    );
    return resolve(mergedData);
  });
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

async function getThemeData(frontendPath?: string): Promise<Data> {
  const dataPath = `${frontendPath ? `${frontendPath}/` : ''}public/data`;
  console.log({dataPath});
  console.log(path.join(dataPath, 'schemas/content-types.json'));
  // Read data from other files
  const pagesData = await readJsonFile(path.join(dataPath, 'pages.json'));
  const contentTypesData = await readJsonFile(
    path.join(dataPath, 'schemas/content-types.json')
  );
  console.log({contentTypesData});
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
    plugins: [],
  };

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
  pageSections: Record<string, number>
): Page[] {
  if (!mergedPages) {
    console.log('returning theme updated page demo sections...');
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
      console.log({pageExists});
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
  console.log('updatePageDemoSections...');
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
