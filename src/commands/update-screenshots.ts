import { readDataFile } from '../utils/file-utils.js';
import { takeScreenshots } from '../utils/screenshot-utils.js';
import { ensureDirectoryExists } from '../utils/file-utils.js';

export async function updateScreenshots(customPort?: string | number): Promise<void> {
  try {
    const data = await readDataFile();
    
    // Ensure screenshots directory exists
    await ensureDirectoryExists('public/images/screenshots');
    
    // Process each page and take screenshots
    for (const page of data.pages) {
      await takeScreenshots(page, customPort);
    }
    
    console.log('✨ Screenshots updated successfully!');
  } catch (error) {
    console.error('Error updating screenshots:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}