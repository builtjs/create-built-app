import { readDataFile, readModulePagesFile, readPagesFile, readSectionsFile } from '../utils/file-utils';
import { takeScreenshots } from '../utils/screenshot-utils';
import { ensureDirectoryExists } from '../utils/file-utils';
import { ThemeOrPlugin } from '../interfaces';
import { initCloudinary } from '../utils/cloudinary-utils';
// import { createSpinner, symbols } from '../utils/cli-utils';
// import chalk from 'chalk';

export async function updateScreenshots(themeOrPlugin: ThemeOrPlugin, type: string, customPort?: string | number): Promise<void> {
  // console.log(chalk.cyan('\n📸 Starting Built App Screenshot Generator\n'));
  console.log(`📸 Updating screenshots...\n`);
  try {
    // const dataSpinner = createSpinner('Reading project data files...').start();
    // Read both data files
    const [modulePagesData, pagesData, sectionsData] = await Promise.all([
      readModulePagesFile(),
      readPagesFile(),
      readSectionsFile()
    ]);
    // dataSpinner.succeed('Project data files loaded successfully');
    
    // const dirSpinner = createSpinner('Ensuring screenshots directory exists...').start();
    // Ensure screenshots directory exists
    await ensureDirectoryExists('public/images/screenshots');
    // dirSpinner.succeed('Screenshots directory ready');
    
    // console.log(chalk.cyan('\n📄 Found Pages:'));
    // data.pages.forEach(page => {
      // console.log(`   ${symbols.info} ${page.name} (${page.sections.length} sections)`);
    // });
    const hasCloudinary = await initCloudinary();
    // Process each page and take screenshots
    for (const modulePage of modulePagesData.modulePages) {
      console.log(`Processing page: ${modulePage.page.name}`);
      // console.log(chalk.cyan(`\n🔍 Processing page: ${chalk.bold(page.name)}`));
      await takeScreenshots(modulePage, pagesData, sectionsData, themeOrPlugin, type, hasCloudinary, customPort);
    }
    
    console.log(`Screenshots updated successfully!\n`);
  } catch (error) {
    // console.error(chalk.red(`\n${symbols.error} Error updating screenshots:`), 
      // error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}