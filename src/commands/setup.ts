import {promises as fs} from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import {setupSiteData} from '../lib/setup/setup-site/import-data/import-data';
import {update} from '../lib/setup/setup-theme/setup-theme';
import {
  getApiKey,
  promptForApiKey,
  saveApiKeyToConfig,
  validateApiKey,
} from '../lib/apiKeyUtils';

interface ThemeOrPlugin {
  language?: string;
  plugins: string[];
  namespace: string;
}

export async function getThemeOrPlugin(
  type: string,
  isConfig?: boolean
): Promise<ThemeOrPlugin | null> {
  const themeFilePath = path.join(
    process.cwd(),
    `${isConfig ? 'config/' : ''}public/data/${type}.json`
  );
  try {
    const data: string = await fs.readFile(themeFilePath, 'utf8');
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
  if (!themeOrPlugin) {
    console.error('Error: No theme or plugin.');
    process.exit(1);
  }
  let apiKey = await getApiKey();
  if (!apiKey) {
    console.error('Unable to process API key.');
    process.exit(1);
  }
  console.log(`Updating ${type}...`);
  const isValid = await validateApiKey(apiKey);
  if (!isValid) {
    apiKey = await promptForApiKey();
  }
  if (apiKey) {
    const isValid = await validateApiKey(apiKey);
    if(isValid){
      await saveApiKeyToConfig(apiKey);
      await update(themeOrPlugin, type, apiKey, process.cwd());
    } else {
      console.error('Unable to process API key.');
      process.exit(1);
    }
  } else {
    console.error('Unable to process API key.');
    process.exit(1);
  }

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
  await setupSiteData();
}
