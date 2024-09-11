// import axios from 'axios';
// import prettier from 'prettier';
// import {
//   getApiKey,
//   promptForApiKey,
//   validateApiKey,
//   saveApiKeyToConfig,
// } from '../lib/apiKeyUtils';
import {Constants} from '../constants';
import {promises as fs} from 'fs';
import * as path from 'path';
// import {getSrcDir} from '../utils';
// import * as zlib from 'zlib';
import * as _ from 'lodash';
// import {mergeData, Data, Page, Section} from '../lib/setup/setup-theme/merge-data';
// import { setupImages } from '../lib/setup/setup-theme/setup-images';
import {setupSiteData} from '../lib/setup/setup-site/import-data/import-data';
import {update} from '../lib/setup/setup-theme/setup-theme';
import {
  getApiKey,
  promptForApiKey,
  saveApiKeyToConfig,
  validateApiKey,
} from '../lib/apiKeyUtils';

interface ThemeOrPlugin {
  // [key: string]: {
  language?: string;
  plugins: string[];
  namespace: string;
  // };
}

// interface SetupResult {
//   namespace: string;
//   data?: any;
//   error?: any;
// }

export async function getThemeOrPlugin(
  type: string,
  isConfig?: boolean
): Promise<ThemeOrPlugin | null> {
  console.log('getThemeOrPlugin...');
  const themeFilePath = path.join(
    process.cwd(),
    `${isConfig ? 'config/' : ''}public/data/${type}.json`
  );
  console.log({themeFilePath});
  try {
    const data: string = await fs.readFile(themeFilePath, 'utf8');
    console.log({data});
    const parsedData = JSON.parse(data);
    return parsedData[type];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File does not exist
      return null;
    } else if (error instanceof SyntaxError) {
      // JSON parsing error
      console.error(`Error parsing ${type}.json:`, error);
      throw error;
    } else {
      // Some other error occurred
      throw error;
    }
  }
}

async function fileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    return false;
  }
}

export async function updateThemeOrPlugin() {
  // const isPlugin = await fileExists(
  //   path.join(process.cwd(), 'public/data/plugin.json')
  // );
  // if (isPlugin) {
  //   console.error(
  //     'Error: It looks like this is a plugin. Update is only used on themes.'
  //   );
  //   process.exit(1);
  // }
  console.log('setup.ts update()...');
  let type = 'theme';
  let themeOrPlugin = await getThemeOrPlugin('theme');
  if (!themeOrPlugin) {
    themeOrPlugin = await getThemeOrPlugin('plugin');
    type = 'plugin';
  }
  if (!themeOrPlugin) {
    console.error(
      'Error: It looks like this not a theme or plugin. Update is only used on themes or plugins.'
    );
    process.exit(1);
  }
  // await validateForUpdate({type, themeOrPlugin});
  console.log('updateThemeOrPlugin...');
  if (!themeOrPlugin) {
    console.error('Error: No theme or plugin.');
    process.exit(1);
  }
  let apiKey = await getApiKey();
  if (!apiKey) {
    console.error('Unable to process API key.');
    process.exit(1);
  }

  const isValid = await validateApiKey(apiKey);
  if (!isValid) {
    console.log('Not valid...');
    apiKey = await promptForApiKey();
    console.log({apiKey});
  }
  console.log('saveApiKeyToConfig...');
  await saveApiKeyToConfig(apiKey);
  console.log(`Updating ${type}...`);
  await update(themeOrPlugin, type, apiKey, process.cwd());
  console.log('Done!');
}

export async function setupSite() {
  const isPlugin = await fileExists(
    path.join(process.cwd(), 'public/data/plugin.json')
  );
  if (isPlugin) {
    console.error(
      'Error: It looks like this is a plugin. Setup is only used on sites.'
    );
    process.exit(1);
  }
  const theme = await getThemeOrPlugin('theme');
  if (theme) {
    console.error(
      'Error: It looks like this is a theme. Setup is only used on sites.'
    );
    process.exit(1);
  }
  const plugin = await getThemeOrPlugin('plugin');
  if (plugin) {
    console.error(
      'Error: It looks like this is a plugin. Setup is only used on sites.'
    );
    process.exit(1);
  }
  // let {type} = options;
  // if (type) {
  //   if (type === Constants.TYPES.site) {
  await setupSiteData();
  // } else if (type === Constants.TYPES.theme) {
  //   await updateTheme(theme);
  // }
  // } else {
  //   if (!theme) {
  //     await setupSiteData();
  //   } else {
  //     await updateTheme(theme);
  //   }
  // }
  // if ((type && type === Constants.TYPES.site) || !theme) {
  //   await setupSiteData();
  // } else if ((type && type === Constants.TYPES.theme) || theme) {
  //   const theme = await getTheme();
  //   if (theme) {
  //     await updateTheme(theme);
  //   } else {
  //     console.error(
  //       'Error: This is not a theme (there is no theme.json file).'
  //     );
  //     process.exit(1);
  //   }
  // }
}
