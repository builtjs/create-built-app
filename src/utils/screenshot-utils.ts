import puppeteer from 'puppeteer';
import kebabCase from 'kebab-case';
import path from 'path';
import {uploadToCloudinary} from './cloudinary-utils.js';
import {updateTemplateImage} from './templates-utils.js';
import {
  ModulePage,
  SectionsData,
  PagesData,
  Section,
  ThemeOrPlugin,
} from '../interfaces.js';
import pluralize from 'pluralize';
import {readCollectionFile} from './file-utils.js';

const LAPTOP_SCREEN_WIDTH = 1366;
const DEFAULT_PORT = 3000;

export async function takeScreenshots(
  modulePage: ModulePage,
  pagesData: PagesData,
  sectionsData: SectionsData,
  themeOrPlugin: ThemeOrPlugin,
  type: string,
  hasCloudinary: boolean,
  customPort?: string | number,
): Promise<void> {
  const port = customPort ? customPort : DEFAULT_PORT;
  const page = pagesData.pages.find(s => s.name === modulePage.page.name);
  if (!page) {
    return;
  }
  if (page.contentType) {
    let collectionFileName = kebabCase(pluralize(page.contentType.name));

    let collectionData = await readCollectionFile(collectionFileName);
    for (const entry of collectionData.data) {
      const pageUrl = `http://localhost:${port}/${kebabCase(page.contentType.name)}/${entry.slug}`;
      await processScreenshots(
        pageUrl,
        modulePage,
        sectionsData.sections,
        themeOrPlugin,
        type,
        hasCloudinary
      );
    }
  } else {
    const pageUrl = `http://localhost:${port}/${page.name !== 'home' ? kebabCase(page.name) : ''}`;
    await processScreenshots(
      pageUrl,
      modulePage,
      sectionsData.sections,
      themeOrPlugin,
      type,
      hasCloudinary
    );
  }
}

async function processScreenshots(
  pageUrl: string,
  modulePage: ModulePage,
  sections: Section[],
  themeOrPlugin: ThemeOrPlugin,
  type: string,
  hasCloudinary: boolean
) {
  const browser = await puppeteer.launch({headless: 'new'});
  try {
    const tab = await browser.newPage();
    // Set viewport width to laptop size, height will adjust to content
    await tab.setViewport({
      width: LAPTOP_SCREEN_WIDTH,
      height: 1,
    });
    await tab.goto(pageUrl, {waitUntil: 'networkidle0'});

    for (const pageSection of modulePage.sections) {
      // Find the full section data from sections.json
      const section = sections.find(s => s.name === pageSection.name);
      if (!section) {
        continue;
      }

      const element = await tab.$(`#${section.defaultTemplate.name}`);
      if (!element) {
        console.log(
          `\nSection "${section.name}" (id: ${section.defaultTemplate.name}) not found on page "${pageUrl}"`,
        );
        continue;
      }
      console.log(
        `Screenshotting "${section.name}" (template: "${section.defaultTemplate.name}")`,
      );
      const screenshotPath = path.join(
        process.cwd(),
        'public/images/screenshots',
        `${section.name}.png`,
      );

      await element.screenshot({
        path: screenshotPath,
        type: 'png',
      });

      if (hasCloudinary) {
        try {
          const publicId = `${type}/${themeOrPlugin.namespace}/${kebabCase(modulePage.page.name)}-${section.defaultTemplate.name}`;
          const cloudinaryUrl = await uploadToCloudinary(
            screenshotPath,
            publicId,
          );
          await updateTemplateImage(
            section.defaultTemplate.name,
            cloudinaryUrl,
          );
          console.log(
            `Uploaded to Cloudinary: ${section.defaultTemplate.name}`,
          );
        } catch (error) {
          console.log(`Failed to upload "${section.name}" to Cloudinary: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  } finally {
    await browser.close();
  }
}
