import { createReadStream } from 'fs';

interface FileData {
  path: string;
}

interface Files {
  [key: string]: FileData;
}

interface Section {
  [key: string]: any; // Adjust this type based on the actual structure of 'section'
}

interface LayoutData {
    sections?: any; // Adjust the type based on the actual structure of 'layout.data.sections'
}

interface FileData {
  path: string;
  name: string;
  size: number;
  type: string;
}

interface File {
  url?: string;
  name: string;
  ext: string;
  path: string;
  repoName: string;
}



/**
 * Create a layout and attach files if there are any
 */
export default async function createLayout(client: any, layout: LayoutData, files?: Record<string, FileData | FileData[]>): Promise<void> {
  try {
    if (files && Object.keys(files).length > 0) {
      for (const [key, fileOrArray] of Object.entries(files)) {
        const [, contentSectionIndex, name] = key.split('.');
        const sectionIndex = parseInt(contentSectionIndex, 10);
        const section = layout.sections[sectionIndex];
        if (section) {
          if (Array.isArray(fileOrArray)) {
            for (const file of fileOrArray) {
              const filePath = file.path;
              // Import image asset
              const imageAsset = await client.assets.upload('image', createReadStream(filePath));
              const asset = {
                _type: 'image',
                asset: {
                  _ref: imageAsset._id,
                  _type: 'reference',
                },
              };
              section[name] = asset;
            }
          } else {
            const filePath = fileOrArray.path;
            // Import image asset
            const imageAsset = await client.assets.upload('image', createReadStream(filePath));
            const asset = {
              _type: 'image',
              asset: {
                _ref: imageAsset._id,
                _type: 'reference',
              },
            };
            section[name] = asset;
          }
        }
      }
    }
    for (const section of layout.sections) {
      try {
        await client.createOrReplace(section);
      } catch (error) {
        console.error('Error creating or replacing document:', error);
      }
    }
  } catch (e) {
    console.error('Error processing layout:', e);
  }
}