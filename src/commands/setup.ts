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
import {updateTheme} from '../lib/setup/setup-theme/setup-theme';

interface Theme {
  language?: string;
  plugins: string[];
}

// interface SetupResult {
//   namespace: string;
//   data?: any;
//   error?: any;
// }

async function getTheme(): Promise<Theme | null> {
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

async function fileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    return false;
  }
}

export async function update() {
  const isPlugin = await fileExists(
    path.join(process.cwd(), 'public/data/plugin.json')
  );
  if (isPlugin) {
    console.error(
      'Error: It looks like this is a plugin. Update is only used on themes.'
    );
    process.exit(1);
  }
  // let {type} = options;
  const theme = await getTheme();
  // if (type) {
  //   if (type === Constants.TYPES.site) {
  //     await setupSiteData();
  //   } else if (type === Constants.TYPES.theme) {
  //     await setupThemeData(theme);
  //   }
  // } else {
    // if (!theme) {
    //   await setupSiteData();
    // } else {
      await updateTheme(theme);
    // }
  // }
  // if ((type && type === Constants.TYPES.site) || !theme) {
  //   await setupSiteData();
  // } else if ((type && type === Constants.TYPES.theme) || theme) {
  //   const theme = await getTheme();
  //   if (theme) {
  //     await setupThemeData(theme);
  //   } else {
  //     console.error(
  //       'Error: This is not a theme (there is no theme.json file).'
  //     );
  //     process.exit(1);
  //   }
  // }
}


export async function setup() {
  const isPlugin = await fileExists(
    path.join(process.cwd(), 'public/data/plugin.json')
  );
  if (isPlugin) {
    console.error(
      'Error: It looks like this is a plugin. Setup is only used on sites.'
    );
    process.exit(1);
  }
  const theme = await getTheme();
  if (theme) {
    console.error(
      'Error: It looks like this is a theme. Setup is only used on sites.'
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
