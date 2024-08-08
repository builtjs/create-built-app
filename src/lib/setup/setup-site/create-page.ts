import {createReadStream} from 'fs';

interface FileData {
  path: string;
}

interface Files {
  [key: string]: FileData;
}

interface Section {
  [key: string]: any; // Adjust this type based on the actual structure of 'section'
}

interface PageData {
  _id: string;
  _type: string;
  sections: Section[];
}

/**
 * Create a page and attach files if there are any
 */
export default async function createPage(
  client: any,
  data: PageData,
files?: Record<string, FileData | FileData[]>
): Promise<void> {
  try {
    if (files) {
      for (const [index, [key, fileOrFiles]] of Object.entries(files).entries()) {
        const [, contentSectionIndex, name] = key.split('.');
      
        // Handle both single file and array of files
        const fileArray = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
      
        for (const file of fileArray) {
          const filePath = file.path;
          // Import image asset
          const imageAsset = await client.assets.upload('image', createReadStream(filePath));
      
          let section = data.sections[parseInt(contentSectionIndex)];
          if (section) {
            const asset = {
              "_type": "image",
              "asset": {
                "_ref": imageAsset._id,
                "_type": "reference"
              }
            };
            section[name] = asset;
          }
        }
      }
      // for (const [key, file] of Object.entries(files)) {
      //   const [, contentSectionIndex, name] = key.split('.');
      //   const filePath = file.path;
      //   // Import image asset
      //   const imageAsset = await client.assets.upload(
      //     'image',
      //     createReadStream(filePath)
      //   );
      //   const sectionIndex = parseInt(contentSectionIndex, 10);
      //   const section = data.sections[sectionIndex];
      //   if (section) {
      //     const asset = {
      //       _type: 'image',
      //       asset: {
      //         _ref: imageAsset._id,
      //         _type: 'reference',
      //       },
      //     };
      //     section[name] = asset;
      //   }
      // }
    }

    try {
      const {_id, _type, ...rest} = data;
      const createdOrUpdatedDoc = await client.createOrReplace({
        _id,
        _type,
        ...rest,
      });
      console.log('Document created or replaced:', createdOrUpdatedDoc._id);
    } catch (error) {
      console.error('Error creating or replacing document:', error);
    }
  } catch (e) {
    console.error('Error processing page:', e);
  }
}
