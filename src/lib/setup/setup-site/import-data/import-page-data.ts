import { promises as fs } from 'fs';
import * as path from 'path';
import { createReadStream } from 'fs';
import * as fileUtils from '../file-utils';
import createPage from '../create-page';

interface FileData {
  path: string;
  name: string;
  size: number;
  type: string;
}

interface PageSection {
  [key: string]: any;
}

interface PageData {
  _id: string;
  _type: string;
  sections: PageSection[];
  [key: string]: any;
}

interface Data {
  pages?: {
    data: PageData;
    files?: Record<string, string[]>;
  }[];
}

interface Files {
  [key: string]: FileData;
}

// Function to import file data
// async function importFileData(filePath: string): Promise<FileData | null> {
//   try {
//     const stats = await fs.stat(filePath);
//     const ext = path.extname(filePath).slice(1);
//     return {
//       path: filePath,
//       name: path.basename(filePath),
//       size: stats.size,
//       type: `image/${ext === 'svg' ? 'svg+xml' : ext}`,
//     };
//   } catch (error) {
//     console.error(`Failed to import file data for ${filePath}:`, error);
//     return null;
//   }
// }

// Main function to import page data
export default async function importPageData(client: any, data: Data | null): Promise<void> {
  if (!data?.pages) {
    return;
  }
  for (const { data: pageData, files: pageFiles } of data.pages) {
    if (!pageData.sections) {
      continue;
    }

    const files: Files = {};
    for (let i = 0; i < data.pages.length; i++) {
      const pageData = data.pages[i];
      for (let i = 0; i < pageData.data.sections.length; i++) {
        const pageFiles = await fileUtils.getFilesData(pageData.files?.page);
        const elementFiles = await fileUtils.getFilesData(pageData.files?.elements);
        const files = {...pageFiles, ...elementFiles};
        await createPage(client, pageData.data, files);
      }
    }
  }
}