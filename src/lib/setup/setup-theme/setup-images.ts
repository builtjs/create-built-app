import {promises as fsPromises} from 'fs';
import * as fs from 'fs';
import path from 'path';
import https from 'https';
import pluralize from 'pluralize';
import {downloadImage} from '../setup-site/file-utils';

interface ThemeOrPlugin {
  language?: string;
  plugins?: string[];
}

interface Field {
  type: string;
  default?: string;
}

interface Section {
  name: string;
  fields: {[key: string]: Field};
  namespace: string;
}

interface ContentType {
  name: string;
  fields: {[key: string]: Field};
}

interface Schema {
  global: {fields: {[key: string]: Field}};
  sections: {[key: string]: Section};
  contentTypes: ContentType[];
}

interface BuiltSection {
  name: string;
  title: string;
  data: {[key: string]: any};
}

interface BuiltData {
  sections: BuiltSection[];
  contentTypes: ContentType[];
  collections: {[key: string]: any};
  global: {[key: string]: any};
  theme?: {[key: string]: any};
  plugin?: {[key: string]: any};
}

// Utility function to read JSON files
async function readJsonFile(filePath: string): Promise<any> {
  const data = await fsPromises.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

// Function to find image fields in global schema
function findImageFieldsInGlobal(global: {
  fields: {[key: string]: Field};
}): string[] {
  return Object.keys(global.fields).filter(
    field => global.fields[field].type === 'image'
  );
}

// Function to find image fields in sections schema
function findImageFieldsInSections(sections: {[key: string]: Section}): {
  [key: string]: {fields: string[]; namespace?: string};
} {
  const result: {[key: string]: {fields: string[]; namespace?: string}} = {};
  for (const sectionName in sections) {
    const fields = sections[sectionName].fields;
    // const namespace = sections[sectionName].namespace;
    // console.log('sections[sectionName]', sections[sectionName]);

    if (fields) {
      const imageFields = Object.keys(fields).filter(
        field => fields[field].type === 'image'
      );
      if (imageFields.length > 0) {
        result[sectionName] = {fields: imageFields};
        // if (namespace) {
        //   result[sectionName].namespace = namespace;
        // }
        // result[sectionName] = imageFields;
      }
    }
  }
  return result;
}

// Function to find image fields in sections schema
function findImageFieldsInContentTypes(contentTypes: ContentType[]): {
  [key: string]: {fields: string[]; namespace?: string};
} {
  const result: {[key: string]: {fields: string[]; namespace?: string}} = {};
  for (const contentType of contentTypes) {
    const fields = contentType.fields;
    // const namespace = contentType.namespace;
    if (fields) {
      const imageFields = Object.keys(fields).filter(
        field => fields[field].type === 'image'
      );
      if (imageFields.length > 0) {
        result[contentType.name] = {fields: imageFields};
        // if (namespace) {
        //   result[contentType.name].namespace = namespace;
        // }
        // result[contentType.name] = imageFields;
      }
    }
  }
  // console.log('contentTypes images result:', result);
  return result;
}
// function findImageFieldsInContentTypes(
//   contentTypes: Array<Record<string, any>>
// ): {
//   [key: string]: {fields: string[]; namespace?: string};
// } {
//   const result: {[key: string]: {fields: string[]; namespace?: string}} = {};
//   console.log({contentTypes});
//   for (const contentType of contentTypes) {
//     const fields = contentType.fields;
//     const namespace = contentType.namespace;
//     if (fields) {
//       const imageFields = Object.keys(fields).filter(
//         field => fields[field].type === 'image'
//       );
//       if (imageFields.length > 0) {
//         result[contentType.name] = {fields: imageFields};
//         if (namespace) {
//           result[contentType.name].namespace = namespace;
//         }
//         // result[contentType.name] = imageFields;
//       }
//     }
//   }
//   return result;
// }

function getImageDataFromBuilt(
  builtData: BuiltData,
  globalSchemaImageFields: string[],
  sectionSchemaImageFields: {
    [key: string]: {fields: string[]; namespace?: string};
  },
  contentTypeSchemaImageFields: {
    [key: string]: {fields: string[]; namespace?: string};
  }
): {path: string; url: string;}[] {
  // console.log('getImageDataFromBuilt...');
  // console.log('contentTypeImageFields...', contentTypeSchemaImageFields);
  // contentTypeSchemaImageFields;
  const images: {path: string; url: string;}[] = [];
  const addedPaths = new Set<string>(); // Set to track added paths

  // Helper function to add an image path if it doesn't already exist
  function addImage(image: any) {
    if (
      !addedPaths.has(
        image.path
      )
    ) {
      // let image = {path: imagePath, namespace: ''};
      // if (namespace) {
      //   image.namespace = namespace;
      // }
      // console.log({namespace});
      // console.log({image});
      images.push(image);
      addedPaths.add(
        image.path
      );
    }
  }

  // Get global images
  globalSchemaImageFields.forEach(field => {
    const image = builtData.global[field];
    if (image && image.path && image.url) {
      addImage(image);
    }
  });
  console.log({sectionSchemaImageFields})
  // Get section images
  builtData.sections.forEach(section => {
    const sectionName = section.name;
    console.log('sectionSchemaImageFields[sectionName]', sectionSchemaImageFields[sectionName])
    if (sectionSchemaImageFields[sectionName]) {
      sectionSchemaImageFields[sectionName].fields.forEach(field => {
        const image = section.data[field];
        // console.log({field})
        // console.log({image})
        if (image && image.path && image.url) {
          addImage(image);
        }
      });
    }
  });

  // Get collection images
  builtData.contentTypes.forEach(contentType => {
    const contentTypeName = contentType.name;
    console.log('contentTypeName:', contentTypeName);
    if (contentTypeSchemaImageFields[contentTypeName]) {
      contentTypeSchemaImageFields[contentTypeName].fields.forEach(field => {
        const collectionName = pluralize(contentTypeName);
        const dataArray = builtData.collections[collectionName];
        // console.log(
        //   'contentTypeImageFields[contentTypeName]',
        //   contentTypeSchemaImageFields[contentTypeName]
        // );
        // console.log('dataArray', dataArray);
        // Ensure `dataArray` is an array and iterate over it
        if (Array.isArray(dataArray)) {
          dataArray.forEach(item => {
            // Check if the object contains the field and the field has a path
            const image = item[field];
            // console.log({image})
            // console.log({image});
            if (image && image.path && image.url) {
              // const namespace = contentTypeImageFields[contentTypeName]
              //   .namespace
              //   ? contentTypeImageFields[contentTypeName].namespace
              //   : '';
              //               let namespacePath = '';
              //               console.log({namespace})
              // console.log('builtData.plugin:',builtData.plugin);
              // console.log('builtData.theme:',builtData.theme)

              //               if (
              //   namespace &&
              //   (builtData.plugin ||
              //     (builtData.theme && builtData.theme.namepace !== namespace))
              // ) {
              //   const [provider, owner, repo] = namespace.split('_');
              //   console.log('setting namespace path:', namespacePath)
              //   namespacePath = `plugins/${provider}_${owner}_${repo}`;
              // }
              // const imagePath = path.join('public', namespacePath, image.path);
              // console.log('addImagePath(imagePath, namespace)', namespace)
              // console.log('adding image...')
              addImage(image);
              // addImagePath(imagePath, namespace);
            }
          });
        }
      });
    }
  });
  return images;
}

// Function to download and save images
// async function downloadAndSaveImages(
//   images: {path: string, namespace: string}[],
//   repoConfig: any
// ) {
//   // const provider = repoConfig.provider;
//   for (const image of images) {
//     // let namespace = image.namespace;
//     // const [provider, owner, repo] = namespace.split('_');
//     // let repoConfig = {
//     //   owner: owner,
//     //   repo: repo,
//     //   provider: provider,
//     // };
//     const directoryPath = image.path.substring(0, image.path.lastIndexOf('/'));
//     const imagePath = path.dirname(directoryPath);
//     if (!(await fsPromises.stat(imagePath).catch(() => false))) {
//       await fsPromises.mkdir(imagePath, {recursive: true});
//     }
//     let imageUrl = '';
//     // let repoName = `${repoConfig.owner}/${repoConfig.repo}`;
//     // if (provider === 'gh') {
//     //   imageUrl = `https://raw.githubusercontent.com/${repoName}/main/${image.path}`;
//     // } else if (provider === 'gl') {
//     //   imageUrl = `https://gitlab.com/${repoName}/-/raw/main/${image.path}`;
//     // } else if (provider === 'bb') {
//     //   imageUrl = `https://bitbucket.org/${repoName}/raw/main/${image.path}`;
//     // } else {
//     //   console.log('Namespace does not start with a recognised prefix.');
//     // }

//     await downloadImage(imageUrl, image.path);
//   }
// }
async function downloadAndSaveImages(
  images: {path: string; url: string}[],
  to: string
) {
  const publicPath = `./public`;
  // const uploadsPath = path.resolve(__dirname, uploadsDirPath);
  const uploadsPath = path.resolve(to, publicPath);
  // const imageUrl = file.url || `${file.path}/${file.name}.${file.ext}`;
  // const provider = repoConfig.provider;
  for (const image of images) {
    // let namespace = image.namespace;
    // const [provider, owner, repo] = namespace.split('_');
    // let repoConfig = {
    //   owner: owner,
    //   repo: repo,
    //   provider: provider,
    // };

    // console.log('image...:', image)
    // const directoryPath = image.path.substring(0, image.path.lastIndexOf('/'));
    // console.log({directoryPath})
    // const imagePath = path.dirname(directoryPath);
    // console.log({imagePath})
    // if (!(await fsPromises.stat(imagePath).catch(() => false))) {
    //   await fsPromises.mkdir(imagePath, {recursive: true});
    // }

    // let imageUrl = '';
    // let repoName = `${repoConfig.owner}/${repoConfig.repo}`;
    // if (provider === 'gh') {
    //   imageUrl = `https://raw.githubusercontent.com/${repoName}/main/${image.path}`;
    // } else if (provider === 'gl') {
    //   imageUrl = `https://gitlab.com/${repoName}/-/raw/main/${image.path}`;
    // } else if (provider === 'bb') {
    //   imageUrl = `https://bitbucket.org/${repoName}/raw/main/${image.path}`;
    // } else {
    //   console.log('Namespace does not start with a recognised prefix.');
    // }

    await downloadImage(image, uploadsPath);
  }
}

export async function updatePluginImagesForTheme(
  themeOrPlugin: ThemeOrPlugin,
  frontendPath: string,
  type: string,
  isConfig?: boolean
) {
  console.log('updatePluginImagesForTheme...isConfig:', isConfig);
  console.log({frontendPath});
  const builtDataPath = path.join(
    frontendPath,
    `public/data/_built/data.json`
  );
  const builtData = (await readJsonFile(builtDataPath)) as BuiltData;
  await updateImages(builtData, frontendPath);
  if (type === 'theme' && themeOrPlugin.plugins) {
    for (const pluginNamespace of themeOrPlugin.plugins) {
      console.log({pluginNamespace});
      await updateImages(
        builtData,
        frontendPath,
        pluginNamespace
      );
    }
  }
}

// export async function updateThemeOrPluginImages(themeNamespace: string) {
//   const projectRoot = process.cwd();
//   const builtDataPath = path.join(projectRoot, `public/data/_built/data.json`);
//   const builtData = (await readJsonFile(builtDataPath)) as BuiltData;
//   await updateImages(builtData, projectRoot, themeNamespace);
// }

export async function updateImages(
  builtData: BuiltData,
  projectRoot: string,
  namespace?: string,
  isPluginForTheme?: boolean
) {
  let pluginPath = '';
  // const [provider, owner, repo] = namespace.split('_');
  // let repoConfig = {
  //   owner: owner,
  //   repo: repo,
  //   provider: provider,
  // };
  console.log({isPluginForTheme});
  if (isPluginForTheme) {
    pluginPath = `/plugins/${namespace}`;
  }
  // Define paths to the schema and data files
  const globalSchemaPath = path.join(
    projectRoot,
    `public/data${pluginPath}/schemas/global.json`
  );
  const sectionsSchemaPath = path.join(
    projectRoot,
    `public/data${pluginPath}/schemas/sections.json`
  );
  const contentTypesSchemaPath = path.join(
    projectRoot,
    `public/data${pluginPath}/schemas/content-types.json`
  );

  // Read schemas and built data
  const globalSchema = (await readJsonFile(globalSchemaPath)) as Schema;
  const sectionsSchema = (await readJsonFile(sectionsSchemaPath)) as Schema;
  const contentTypesSchema = (await readJsonFile(
    contentTypesSchemaPath
  )) as Schema;

  // Find image fields
  const globalSchemaImageFields = findImageFieldsInGlobal(globalSchema.global);
  const sectionSchemaImageFields = findImageFieldsInSections(
    sectionsSchema.sections
  );
  // const contentTypeSchemaImageFields = findImageFieldsInContentTypes(
  //   builtData.contentTypes
  // );
  const contentTypeSchemaImageFields = findImageFieldsInContentTypes(
    contentTypesSchema.contentTypes
  );

  // Get image data
  const images = getImageDataFromBuilt(
    builtData,
    globalSchemaImageFields,
    sectionSchemaImageFields,
    contentTypeSchemaImageFields
  );
  // console.log({images});

  // Download and save images
  await downloadAndSaveImages(images, projectRoot);
  console.log('Done saving images for isPluginForTheme: ' + isPluginForTheme);
}
