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

async function downloadImage(url: string, fullPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${url}. Status code: ${response.statusCode}`));
        return;
      }

      const writeStream = fs.createWriteStream(fullPath);
      response.pipe(writeStream);

      writeStream.on("finish", () => {
        writeStream.close();
        resolve();
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

async function getFileSizeInBytes(filePath: string): Promise<number> {
  const stats = await fsp.stat(filePath);
  return stats.size;
}

// async function getFileData(file: any): Promise<FileData> {
//   const filePath = `./data/uploads`;
//   const uploadsPath = path.resolve(__dirname, filePath);
//   const imageUrl = file.url || `${file.path}/${file.name}.${file.ext}`;
//   const fullPath = path.join(uploadsPath, imageUrl);

//   const lastSlashIndex = imageUrl.lastIndexOf("/");
//   const imagePath = imageUrl.substring(0, lastSlashIndex + 1);
//   const imageName = imageUrl.substring(lastSlashIndex + 1);

//   if (!fs.existsSync(path.join(uploadsPath, imagePath))) {
//     await fsp.mkdir(path.join(uploadsPath, imagePath), { recursive: true });
//   }

//   const url = `https://raw.githubusercontent.com/${file.repoName}/main/public${imageUrl}`;
//   await downloadImage(url, fullPath);

//   const size = await getFileSizeInBytes(fullPath);
//   const mimeType = `image/${file.ext === "svg" ? "svg+xml" : file.ext}`;

//   return {
//     path: fullPath,
//     name: imageName,
//     size,
//     type: mimeType,
//   };
// }
interface FileObject {
  repo: {
    owner: string,
    repo: string,
    provider: string
  };
  path: string;
  [key: string]: any; // This allows additional properties
}

async function getFileData(file: FileObject): Promise<FileData> {
  const uploadsDirPath = `./data/uploads`;
  let repoConfig = file.repo;
  let imageUrl = '';
  let repoName = `${repoConfig.owner}/${repoConfig.repo}`;
  const provider = repoConfig.provider;
  if (provider === 'gh') {
    imageUrl = `https://raw.githubusercontent.com/${repoName}/main/public${file.path}`;
  } else if (provider === 'gl') {
    imageUrl = `https://gitlab.com/${repoName}/-/raw/main/public${file.path}`;
  } else if (provider === 'bb') {
    imageUrl = `https://bitbucket.org/${repoName}/raw/main/public${file.path}`;
  } else {
    console.log('Namespace does not start with a recognised prefix.');
  }
  const uploadsPath = path.resolve(__dirname, uploadsDirPath);
  // const imageUrl = file.url || `${file.path}/${file.name}.${file.ext}`;
  const fullPath = path.join(uploadsPath, file.path);

  // const lastSlashIndex = imageUrl.lastIndexOf('/');
  // const imagePath = imageUrl.substring(0, lastSlashIndex + 1);
  // const imageName = imageUrl.substring(lastSlashIndex + 1);

  const directoryPath = file.path.substring(0, file.path.lastIndexOf('/'));
  const fileName = file.path.substring(
    file.path.lastIndexOf('/') + 1,
    file.path.lastIndexOf('.')
  );

  const fileExtension = file.path.substring(file.path.lastIndexOf('.') + 1);

  if (!fs.existsSync(path.join(uploadsPath, directoryPath))) {
    await fsp.mkdir(path.join(uploadsPath, directoryPath), {recursive: true});
  }

  await downloadImage(imageUrl, fullPath);

  const size = await getFileSizeInBytes(fullPath);
  const mimeType = `image/${fileExtension === 'svg' ? 'svg+xml' : fileExtension}`;

  return {
    path: fullPath,
    name: fileName,
    size,
    type: mimeType,
  };
}

// async function getFilesData(files: Record<string, any>): Promise<Record<string, any>> {
//   const fileData: Record<string, any> = {};

//   async function processFileData(file: any): Promise<FileData | null> {
//     if (file && Object.keys(file).length > 0) {
//       const data = await getFileData(file);
//       if (data && Object.keys(data).length > 0) {
//         return data;
//       }
//     }
//     return null;
//   }

//   for (const [key, fileOrArray] of Object.entries(files)) {
//     if (Array.isArray(fileOrArray)) {
//       const fileDataArray = await Promise.all(
//         fileOrArray.map(processFileData)
//       );
//       const filteredFileDataArray = fileDataArray.filter(data => data !== null);
//       if (filteredFileDataArray.length > 0) {
//         fileData[key] = filteredFileDataArray;
//       }
//     } else {
//       const fileDataSingle = await processFileData(fileOrArray);
//       if (fileDataSingle !== null) {
//         fileData[key] = fileDataSingle;
//       }
//     }
//   }

//   return fileData;
// }

async function getFilesData(files: any): Promise<Record<string, FileData | FileData[]>> {
  const fileData: Record<string, FileData | FileData[]> = {};

  if (!files) return fileData;
  for (const [key, fileOrArray] of Object.entries(files)) {
    if (Array.isArray(fileOrArray)) {
      const fileDataArray = await Promise.all(
        fileOrArray
          .filter(file => Object.keys(file).length !== 0 && file.repo && file.path) // Filter out empty objects
          .map(file => getFileData(file))
      );
      if (fileDataArray.length > 0) {
        fileData[key] = fileDataArray;
      }
    } 
      else if (typeof fileOrArray === 'object' && fileOrArray !== null ) {
      if (Object.keys(fileOrArray).length !== 0 && (fileOrArray as FileObject).repo && (fileOrArray as FileObject).path) { 
        const fileDataSingle = await getFileData(fileOrArray as FileObject);
        if (Object.keys(fileDataSingle).length !== 0) {
          fileData[key] = fileDataSingle;
        }
      }
    }
  }
  return fileData;
}

// async function getFilesData(files: any): Promise<Record<string, FileData | FileData[]>> {
//   const fileData: Record<string, FileData | FileData[]> = {};

//   if (!files) return fileData;
//   for (const [key, fileOrArray] of Object.entries(files)) {
//     if (Array.isArray(fileOrArray)) {
//       const fileDataArray = await Promise.all(
//         fileOrArray
//           .filter(file => Object.keys(file).length !== 0) // Filter out empty objects
//           .map(file => getFileData(file))
//       );
//       if (fileDataArray.length > 0) {
//         fileData[key] = fileDataArray;
//       }
//     } 
//       else if (typeof fileOrArray === 'object' && fileOrArray !== null) {
//       if (Object.keys(fileOrArray).length !== 0) { 
//         const fileDataSingle = await getFileData(fileOrArray);
//         if (Object.keys(fileDataSingle).length !== 0) {
//           fileData[key] = fileDataSingle;
//         }
//       }
//     }
//   }
//   return fileData;
// }

export { getFileSizeInBytes, getFileData, getFilesData };
