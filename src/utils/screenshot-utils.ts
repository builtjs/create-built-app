import puppeteer from 'puppeteer';
import kebabCase from 'kebab-case';
import path from 'path';
import { findNextPort } from './port-utils.js';
// import { Page, Section } from '../types/index.js';
import { initCloudinary, uploadToCloudinary } from './cloudinary-utils.js';
import { updateTemplateImage } from './templates-utils.js';
import { ModulePage, SectionsData, PagesData, Section, Page, ThemeOrPlugin } from '../interfaces.js';
import pluralize from 'pluralize';
import { readCollectionFile } from './file-utils.js';
// import { SCREEN_SIZES } from '../constants/screen-sizes.js';
// import { createSpinner, createProgressBar, symbols } from './cli-utils.js';
// import chalk from 'chalk';

const LAPTOP_SCREEN_WIDTH = 1366;
const DEFAULT_PORT = 3000;

export async function takeScreenshots(modulePage: ModulePage, pagesData: PagesData, sectionsData: SectionsData, themeOrPlugin: ThemeOrPlugin, type: string, customPort?: string | number): Promise<void> {
  // const browserSpinner = createSpinner('Launching browser...').start();
  const port = customPort ? customPort : DEFAULT_PORT;
  console.log({modulePage})
  const page = pagesData.pages.find(s => s.name === modulePage.page.name);
  console.log({page})
  if(!page){
    return;
  }
  if(page.contentType){
    console.log('ct')
    let collectionFileName = kebabCase(pluralize(page.contentType.name));

    let collectionData = await readCollectionFile(collectionFileName);
    console.log({collectionData})
    for (const entry of collectionData.data) {
      console.log({entry})
      const pageUrl = `http://localhost:${port}/${kebabCase(page.contentType.name)}/${entry.slug}`;
    await processScreenshots(pageUrl, page, sectionsData.sections, themeOrPlugin, type, customPort);
    }
  }else{
    console.log('no ct')
    const pageUrl = `http://localhost:${port}/${kebabCase(page.name)}`;
    await processScreenshots(pageUrl, page, sectionsData.sections, themeOrPlugin, type, customPort);
  }
  
}

async function processScreenshots(pageUrl: string, page: Page, sections: Section[], themeOrPlugin: ThemeOrPlugin, type: string, customPort?: string | number){
  const browser = await puppeteer.launch({headless: "new"});
  // browserSpinner.succeed('Browser launched');
  
  try {
    const tab = await browser.newPage();
    // Set viewport width to laptop size, height will adjust to content
    await tab.setViewport({
      width: LAPTOP_SCREEN_WIDTH,
      height: 1
    });
    
    
    // const loadingSpinner = createSpinner(`Loading page ${pageUrl}`).start();
    await tab.goto(pageUrl, { waitUntil: 'networkidle0' });
    // loadingSpinner.succeed(`Page loaded: ${pageUrl}`);
    // Check if Cloudinary credentials exist
    // const cloudinarySpinner = createSpinner('Checking Cloudinary configuration...').start();
    const hasCloudinary = await initCloudinary();
    // if (hasCloudinary) {
    //   cloudinarySpinner.succeed('Cloudinary configured successfully');
    // } else {
    //   cloudinarySpinner.warn('Cloudinary not configured - skipping image uploads');
    // }
    // const progressBar = createProgressBar();
    // progressBar.start(page.sections.length, 0);
    for (const pageSection of page.sections) {
      // Find the full section data from sections.json
      const section = sections.find(s => s.name === pageSection.name);
      console.log({section})
      if (!section) {
        // console.log(`\n${symbols.warning} Section "${pageSection.name}" not found in sections.json`);
        // progressBar.increment();
        continue;
      }
      
      const element = await tab.$(`#${section.defaultTemplate.name}`);
      if (!element) {
        // console.log(`\n${symbols.warning} Section "${section.name}" (id: ${section.id}) not found on page "${page.name}"`);
        console.log(`\nSection "${section.name}" (id: ${section.defaultTemplate.name}) not found on page "${pageUrl}"`);
        // progressBar.increment();
        continue;
      }
      
      const screenshotPath = path.join(
        process.cwd(),
        'public/images/screenshots',
        `${section.name}.png`
      );
      
      await element.screenshot({
        path: screenshotPath,
        type: 'png'
      });
      
      if (hasCloudinary) {
        try {
          const publicId = `${type}/${themeOrPlugin.namespace}/${kebabCase(page.name)}-${section.defaultTemplate.name}`;
          const cloudinaryUrl = await uploadToCloudinary(screenshotPath, publicId);
          await updateTemplateImage(section.defaultTemplate.name, cloudinaryUrl);
          // console.log(`\n${symbols.success} ${chalk.green(`Uploaded to Cloudinary: ${section.name}`)}`);
        } catch (error) {
          // console.log(`\n${symbols.error} ${chalk.red(`Failed to upload "${section.name}" to Cloudinary: ${error instanceof Error ? error.message : String(error)}`)}`);
        }
      }
      
      // progressBar.increment();
    }
    
    // progressBar.stop();
  } finally {
    // const closingSpinner = createSpinner('Closing browser...').start();
    await browser.close();
    // closingSpinner.succeed('Browser closed');
  }
}