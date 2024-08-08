import createLayout from '../create-layout';
import * as fileUtils from '../file-utils';
interface File {
  url?: string;
  name: string;
  ext: string;
  path?: string;
  repoName: string;
}

interface LayoutData {
  files: Record<string, File | File[]>; // Ensure this type matches the expected input for getFilesData
  data: any; // Adjust the type based on the actual structure of 'global.data'
}
export default async function importLayoutData(client: any, layout: LayoutData) {
  if (!layout || !layout.data || !layout.data.sections) {
    return;
  }
  const pageFiles = await fileUtils.getFilesData(layout.files.page);
  const elementFiles = await fileUtils.getFilesData(layout.files.elements);
  const files = {...pageFiles, ...elementFiles};
  await createLayout(client, layout.data, files);
}
// import createLayout from '../create-layout';
// import { promises as fs } from 'fs';
// import * as path from 'path';

// interface FileData {
//   path: string;
//   name: string;
//   size: number;
//   type: string;
// }

// interface LayoutData {
//   data?: {
//     sections?: any; // Adjust the type based on the actual structure of 'layout.data.sections'
//     [key: string]: any; // Adjust as needed to cover other possible properties
//   };
//   files?: {
//     page: string[];
//   };
// }

// // Function to import file data
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

// // Main function to import layout data
// export default async function importLayoutData(client: any, layout: LayoutData | null): Promise<void> {
//   if (!layout || !layout.data || !layout.data.sections) {
//     return;
//   }

//   const files: Record<string, FileData> = {};

//   if (layout.files?.page) {
//     for (const filePath of layout.files.page) {
//       const fileData = await importFileData(filePath);
//       if (fileData) {
//         files[filePath] = fileData;
//       }
//     }
//   }

//   await createLayout(client, layout, files);
// }
