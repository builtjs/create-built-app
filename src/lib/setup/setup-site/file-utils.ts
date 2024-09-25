import https from 'https';
import fs from 'fs';
import path from 'path';

const fsp = fs.promises;

interface File {
  url?: string;
  name: string;
  ext: string;
  path?: string;
  repoName: string;
}

interface FileData {
  path: string;
  name: string;
  size: number;
  type: string;
}

function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {recursive: true});
    }
  } catch (err) {
    console.error(`Error creating directory ${dir}:`, err);
    throw err;
  }
}
async function downloadImage(
  image: {path: string; url: string},
  uploadsPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    let fullPath = `${uploadsPath}/${image.path}`;
    https
      .get(image.url, response => {
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download image: ${image.url}. Status code: ${response.statusCode}`
            )
          );
          return;
        }
        ensureDirectoryExists(fullPath);
        const writeStream = fs.createWriteStream(fullPath);
        response.pipe(writeStream);

        writeStream.on('finish', () => {
          writeStream.close();
          resolve();
        });

        writeStream.on('error', err => {
          reject(err);
        });
      })
      .on('error', err => {
        reject(err);
      });
  });
}

async function getFileSizeInBytes(filePath: string): Promise<number> {
  const stats = await fsp.stat(filePath);
  return stats.size;
}

interface FileObject {
  path: string;
  url: string;
  [key: string]: any; // This allows additional properties
}

async function getFileData(file: FileObject): Promise<FileData> {
  const uploadsDirPath = `setup/uploads`;
  const uploadsPath = path.join(process.cwd(), uploadsDirPath);
  const fullPath = path.join(uploadsPath, file.path);
  const directoryPath = file.path.substring(0, file.path.lastIndexOf('/'));
  const fileName = file.path.substring(
    file.path.lastIndexOf('/') + 1,
    file.path.lastIndexOf('.')
  );

  const fileExtension = file.path.substring(file.path.lastIndexOf('.') + 1);

  if (!fs.existsSync(path.join(uploadsPath, directoryPath))) {
    await fsp.mkdir(path.join(uploadsPath, directoryPath), {recursive: true});
  }

  await downloadImage(file, uploadsPath);

  const size = await getFileSizeInBytes(fullPath);
  const mimeType = `image/${fileExtension === 'svg' ? 'svg+xml' : fileExtension}`;
  return {
    path: fullPath,
    name: fileName,
    size,
    type: mimeType,
  };
}

async function getFilesData(
  files: any
): Promise<Record<string, FileData | FileData[]>> {
  const fileData: Record<string, FileData | FileData[]> = {};

  if (!files) return fileData;
  for (const [key, fileOrArray] of Object.entries(files)) {
    if (Array.isArray(fileOrArray)) {
      const fileDataArray = await Promise.all(
        fileOrArray
          .filter(file => Object.keys(file).length !== 0 && file.path) // Filter out empty objects
          .map(file => getFileData(file))
      );
      if (fileDataArray.length > 0) {
        fileData[key] = fileDataArray;
      }
    } else if (typeof fileOrArray === 'object' && fileOrArray !== null) {
      if (
        Object.keys(fileOrArray).length !== 0 &&
        (fileOrArray as FileObject).path &&
        (fileOrArray as FileObject).url
      ) {
        const fileDataSingle = await getFileData(fileOrArray as FileObject);
        if (Object.keys(fileDataSingle).length !== 0) {
          fileData[key] = fileDataSingle;
        }
      }
    }
  }
  return fileData;
}

export {getFileSizeInBytes, getFileData, getFilesData, downloadImage};
