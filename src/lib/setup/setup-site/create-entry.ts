import { createReadStream } from 'fs';

interface FileData {
  path: string;
}

interface Files {
  [key: string]: FileData | FileData[];
}

interface Data {
  _id: string;
  _type: string;
  [key: string]: any; // Adjust as needed for other properties
}

/**
 * Create an entry and attach files if there are any
 */
export default async function createEntry(client: any, data: any, files?: Files): Promise<void> {
  try {
    if (files) {
      for (const [key, item] of Object.entries(files)) {
        if (Array.isArray(item)) {
          const assetArray = await Promise.all(item.map(async (file) => {
            const filePath = file.path;
            const imageAsset = await client.assets.upload(
              'image',
              createReadStream(filePath)
            );
            return {
              _type: 'image',
              asset: {
                _ref: imageAsset._id,
                _type: 'reference',
              },
            };
          }));
          data[key] = assetArray;
        } else {
          const filePath = item.path;
          const imageAsset = await client.assets.upload(
            'image',
            createReadStream(filePath)
          );
          const asset = {
            _type: 'image',
            asset: {
              _ref: imageAsset._id,
              _type: 'reference',
            },
          };
          data[key] = asset;
        }
      }
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
    console.log({ e });
  }
}
