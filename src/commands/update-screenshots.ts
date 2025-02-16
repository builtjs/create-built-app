import chalk from 'chalk';
import { readDataFile, readModulePagesFile, readPagesFile, readSectionsFile } from '../utils/file-utils';
import { takeScreenshots } from '../utils/screenshot-utils';
import { ensureDirectoryExists } from '../utils/file-utils';
import { ThemeOrPlugin } from '../interfaces';
import { initCloudinary } from '../utils/cloudinary-utils';

export async function updateScreenshots(themeOrPlugin: ThemeOrPlugin, type: string, customPort?: string | number): Promise<void> {
  console.log(chalk.blue(`📸 Updating screenshots...\n`));
  try {
    // Read both data files
    const [modulePagesData, pagesData, sectionsData] = await Promise.all([
      readModulePagesFile(),
      readPagesFile(),
      readSectionsFile()
    ]);
    // Ensure screenshots directory exists
    await ensureDirectoryExists('public/images/screenshots');
    const hasCloudinary = await initCloudinary();
    if(!hasCloudinary){
      console.error('Cloudinary variables not found in .env file');
      throw new Error();
    }
    // Process each page and take screenshots
    for (const modulePage of modulePagesData.modulePages) {
      console.log(`Processing page: ${modulePage.page.name}`);
      await takeScreenshots(modulePage, pagesData, sectionsData, themeOrPlugin, type, hasCloudinary, customPort);
    }
  } catch (error) {
    process.exit(1);
  }
}