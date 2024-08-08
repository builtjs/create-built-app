import { promises as fsPromises } from 'fs';
import * as fs from 'fs';
import path from 'path';
import https from 'https';

interface Field {
  type: string;
  default?: string;
}

interface Section {
  name: string;
  fields: { [key: string]: Field };
}

interface Schema {
  global: { fields: { [key: string]: Field } };
  sections: { [key: string]: Section };
}

interface BuiltSection {
  name: string;
  title: string;
  data: { [key: string]: any };
}

interface BuiltData {
  sections: BuiltSection[];
  global: { [key: string]: any };
}

// Utility function to read JSON files
async function readJsonFile(filePath: string): Promise<any> {
  const data = await fsPromises.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

// Function to find image fields in global schema
function findImageFieldsInGlobal(global: { fields: { [key: string]: Field } }): string[] {
  return Object.keys(global.fields).filter((field) => global.fields[field].type === 'image');
}

// Function to find image fields in sections schema
function findImageFieldsInSections(sections: { [key: string]: Section }): { [key: string]: string[] } {
  const result: { [key: string]: string[] } = {};
  for (const sectionName in sections) {
    const fields = sections[sectionName].fields;
    if (fields) {
      const imageFields = Object.keys(fields).filter((field) => fields[field].type === 'image');
      if (imageFields.length > 0) {
        result[sectionName] = imageFields;
      }
    }
  }
  return result;
}

// Function to get image data from _built.json
function getImageDataFromBuilt(
  builtData: BuiltData,
  globalImageFields: string[],
  sectionImageFields: { [key: string]: string[] },
  repoName: string
) {
  const images: { url: string; path: string; repoName: string; ext: string }[] = [];

  // Get global images
  globalImageFields.forEach((field) => {
    const image = builtData.global[field];
    if (image && image.url) {
      images.push({
        url: image.url,
        path: path.join('public', image.url),
        repoName: repoName.replace('_', '/'),
        ext: image.ext,
      });
    }
  });

  // Get section images
  builtData.sections.forEach((section) => {
    const sectionName = section.name;
    if (sectionImageFields[sectionName]) {
      sectionImageFields[sectionName].forEach((field) => {
        const image = section.data[field];
        if (image && image.url) {
          images.push({
            url: image.url,
            path: path.join('public', image.path, `${image.name}.${image.ext}`),
            repoName: repoName,
            ext: image.ext,
          });
        }
      });
    }
  });

  return images;
}

// Function to download an image
async function downloadImage(url: string, fullPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${url}. Status code: ${response.statusCode}`));
        return;
      }

      const writeStream = fs.createWriteStream(fullPath);
      response.pipe(writeStream);

      writeStream.on('finish', () => {
        writeStream.close();
        resolve();
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Function to download and save images
async function downloadAndSaveImages(images: { url: string; path: string; repoName: string; ext: string }[]) {
  for (const image of images) {
    const imagePath = path.dirname(image.path);
    if (!(await fsPromises.stat(imagePath).catch(() => false))) {
      await fsPromises.mkdir(imagePath, { recursive: true });
    }

    const imageUrl = `https://raw.githubusercontent.com/${image.repoName.replace('_','/')}/main/public${image.url}`;
    await downloadImage(imageUrl, image.path);
  }
}

export async function setupImages(plugins: string[]) {
  // Get the path to the project root
  const projectRoot = process.cwd();

  for (const plugin of plugins) {
    // Define paths to the schema and data files
    const globalSchemaPath = path.join(projectRoot, `public/data/plugins/${plugin}/schemas/global.json`);
    const sectionsSchemaPath = path.join(projectRoot, `public/data/plugins/${plugin}/schemas/sections.json`);
    const builtDataPath = path.join(projectRoot, `public/data/_built/data.json`);

    // Read schemas and built data
    const globalSchema = (await readJsonFile(globalSchemaPath)) as Schema;
    const sectionsSchema = (await readJsonFile(sectionsSchemaPath)) as Schema;
    const builtData = (await readJsonFile(builtDataPath)) as BuiltData;

    // Find image fields
    const globalImageFields = findImageFieldsInGlobal(globalSchema.global);
    const sectionImageFields = findImageFieldsInSections(sectionsSchema.sections);

    // Get image data
    const images = getImageDataFromBuilt(builtData, globalImageFields, sectionImageFields, plugin);

    // Download and save images
    await downloadAndSaveImages(images);

    console.log(`Images for plugin ${plugin} downloaded and saved.`);
  }
}

// import {promises as fsPromises} from 'fs';
// import * as fs from 'fs';
// import path from 'path';
// import https from 'https';

// interface Field {
//   type: string;
//   default?: string;
// }

// interface Section {
//   name: string;
//   fields: {[key: string]: Field};
// }

// interface Schema {
//   global: {fields: {[key: string]: Field}};
//   sections: {[key: string]: Section};
// }

// interface BuiltSection {
//   name: string;
//   title: string;
//   data: {[key: string]: any};
// }

// interface BuiltData {
//   sections: BuiltSection[];
//   global: {[key: string]: any};
// }

// // Utility function to read JSON files
// async function readJsonFile(filePath: string): Promise<any> {
//   const data = await fsPromises.readFile(filePath, 'utf-8');
//   return JSON.parse(data);
// }

// // Function to find image fields in global schema
// function findImageFieldsInGlobal(global: {
//   fields: {[key: string]: Field};
// }): string[] {
//   return Object.keys(global.fields).filter(
//     field => global.fields[field].type === 'image'
//   );
// }

// // Function to find image fields in sections schema
// function findImageFieldsInSections(sections: {[key: string]: Section}): {
//   [key: string]: string[];
// } {
//   const result: {[key: string]: string[]} = {};
//   for (const sectionName in sections) {
//     const fields = sections[sectionName].fields;
//     if (fields) {
//       const imageFields = Object.keys(fields).filter(
//         field => fields[field].type === 'image'
//       );
//       if (imageFields.length > 0) {
//         result[sectionName] = imageFields;
//       }
//     }
//   }
//   return result;
// }

// // Function to get image data from _built.json
// function getImageDataFromBuilt(
//   builtData: BuiltData,
//   globalImageFields: string[],
//   sectionImageFields: {[key: string]: string[]},
//   repoName: string
// ) {
//   const images: {url: string; path: string; repoName: string; ext: string}[] =
//     [];

//   // Get global images
//   globalImageFields.forEach(field => {
//     const image = builtData.global[field];
//     if (image && image.url) {
//       images.push({
//         url: image.url,
//         path: path.join(
//           'public/images',
//           image.path,
//           `${image.name}.${image.ext}`
//         ),
//         repoName: repoName,
//         ext: image.ext,
//       });
//     }
//   });

//   // Get section images
//   builtData.sections.forEach(section => {
//     const sectionName = section.name;
//     if (sectionImageFields[sectionName]) {
//       sectionImageFields[sectionName].forEach(field => {
//         const image = section.data[field];
//         if (image && image.url) {
//           images.push({
//             url: image.url,
//             path: path.join(
//               'public/images',
//               image.path,
//               `${image.name}.${image.ext}`
//             ),
//             repoName: repoName,
//             ext: image.ext,
//           });
//         }
//       });
//     }
//   });

//   return images;
// }

// // Function to download an image
// async function downloadImage(url: string, fullPath: string): Promise<void> {
//   return new Promise((resolve, reject) => {
//     https
//       .get(url, response => {
//         if (response.statusCode !== 200) {
//           reject(
//             new Error(
//               `Failed to download image: ${url}. Status code: ${response.statusCode}`
//             )
//           );
//           return;
//         }

//         const writeStream = fs.createWriteStream(fullPath);
//         response.pipe(writeStream);

//         writeStream.on('finish', () => {
//           writeStream.close();
//           resolve();
//         });

//         writeStream.on('error', err => {
//           reject(err);
//         });
//       })
//       .on('error', err => {
//         reject(err);
//       });
//   });
// }

// // Function to download and save images
// async function downloadAndSaveImages(
//   images: {url: string; path: string; repoName: string; ext: string}[]
// ) {
//   for (const image of images) {
//     const imagePath = path.dirname(image.path);
//     if (!(await fsPromises.stat(imagePath).catch(() => false))) {
//       await fsPromises.mkdir(imagePath, {recursive: true});
//     }

//     const imageUrl = `https://raw.githubusercontent.com/${image.repoName}/main/public${image.url}`;
//     await downloadImage(imageUrl, image.path);
//   }
// }

// export async function setupImages(repoName: string) {
//   // Get the path to the project root
//   const projectRoot = process.cwd();

//   // Define paths to the schema and data files
//   const globalSchemaPath = path.join(
//     projectRoot,
//     'public/data/schemas/global.json'
//   );
//   const sectionsSchemaPath = path.join(
//     projectRoot,
//     'public/data/schemas/sections.json'
//   );
//   const builtDataPath = path.join(projectRoot, 'public/data/_built/data.json');

//   // Read schemas and built data
//   const globalSchema = (await readJsonFile(globalSchemaPath)) as Schema;
//   const sectionsSchema = (await readJsonFile(sectionsSchemaPath)) as Schema;
//   const builtData = (await readJsonFile(builtDataPath)) as BuiltData;

//   // Find image fields
//   const globalImageFields = findImageFieldsInGlobal(globalSchema.global);
//   const sectionImageFields = findImageFieldsInSections(sectionsSchema.sections);

//   // Get image data
//   const images = getImageDataFromBuilt(
//     builtData,
//     globalImageFields,
//     sectionImageFields,
//     repoName
//   );

//   // Download and save images
//   await downloadAndSaveImages(images);

//   console.log('Images downloaded and saved.');
// }
