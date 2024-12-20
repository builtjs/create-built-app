import puppeteer from 'puppeteer';
import kebabCase from 'kebab-case';
import path from 'path';
import { findNextPort } from './port-utils.js';
import { Page } from '../../interfaces.js';

export async function takeScreenshots(page: Page, customPort?: string | number): Promise<void> {
  const browser = await puppeteer.launch();
  try {
    const port = customPort ? Number(customPort) : await findNextPort();
    const tab = await browser.newPage();
    const pageUrl = `http://localhost:${port}/${kebabCase(page.name)}`;
    
    console.log(`📷 Taking screenshots from ${pageUrl}`);
    
    await tab.goto(pageUrl, { waitUntil: 'networkidle0' });
    
    for (const section of page.sections) {
      const element = await tab.$(`#${section.name}`);
      if (!element) {
        console.warn(`⚠️ Section "${section.name}" not found on page "${page.name}"`);
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
      
      console.log(`📸 Captured screenshot for section "${section.name}"`);
    }
  } finally {
    await browser.close();
  }
}