import {promises as fsPromises} from 'fs';
import path from 'path';
import pluralize from 'pluralize';
import {downloadImage} from '../setup-site/file-utils';
import {BuiltData, ContentType, Field} from '../../../interfaces.js';

interface ThemeOrPlugin {
  language?: string;
  plugins?: string[];
}

interface Section {
  name: string;
  fields: {[key: string]: Field};
  namespace: string;
}

interface Element {
  name: string;
  fields: {[key: string]: Field};
}

interface Schema {
  global: {fields: {[key: string]: Field}};
  sections: {[key: string]: Section};
  contentTypes: ContentType[];
  elements: Element[];
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

    if (fields) {
      const imageFields = Object.keys(fields).filter(
        field => fields[field].type === 'image'
      );
      if (imageFields.length > 0) {
        result[sectionName] = {fields: imageFields};
      }
    }
  }
  return result;
}

// Function to find image fields in elements schema
function findImageFieldsInElements(elements: Element[]): {
  [key: string]: {fields: string[]; namespace?: string};
} {
  const result: {[key: string]: {fields: string[]}} = {};
  for (const element of elements) {
    const fields = element.fields;

    if (fields) {
      const imageFields = Object.keys(fields).filter(
        field => fields[field].type === 'image'
      );
      if (imageFields.length > 0) {
        result[element.name] = {fields: imageFields};
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
    if (fields) {
      const imageFields = Object.keys(fields).filter(
        field => fields[field].type === 'image'
      );
      if (imageFields.length > 0) {
        result[contentType.name] = {fields: imageFields};
      }
    }
  }
  return result;
}

function getImageDataFromBuilt(
  builtData: BuiltData,
  globalSchemaImageFields: string[] | null,
  sectionSchemaImageFields: {
    [key: string]: {fields: string[]; namespace?: string};
  },
  contentTypeSchemaImageFields: {
    [key: string]: {fields: string[]; namespace?: string};
  },
  elementSchemaImageFields: {
    [key: string]: {fields: string[]};
  }
): {path: string; url: string}[] {
  const images: {path: string; url: string}[] = [];
  const addedPaths = new Set<string>(); // Set to track added paths

  // Helper function to add an image path if it doesn't already exist
  function addImage(image: any) {
    if (!addedPaths.has(image.path)) {
      images.push(image);
      addedPaths.add(image.path);
    }
  }

  if (builtData.global && globalSchemaImageFields) {
    const globalData = builtData.global;
    globalSchemaImageFields.forEach(field => {
      const image = globalData[field];
      if (image && image.path && image.url) {
        addImage(image);
      }
    });
  }

  // Get section images
  builtData.sections.forEach(section => {
    if (section.data) {
      const sectionName = section.name;

      if (sectionSchemaImageFields[sectionName]) {
        sectionSchemaImageFields[sectionName].fields.forEach(field => {
          const image = section.data[field];
          if (image && image.path && image.url) {
            addImage(image);
          }
        });
      }
      Object.keys(section.data).map((fieldOrArray: any) => {
        if (Array.isArray(section.data[fieldOrArray])) {
          let singularName = pluralize.singular(fieldOrArray);
          console.log({singularName})
          section.data[fieldOrArray].forEach((element: any) => {
            for (const key in element) {
              if (
                elementSchemaImageFields[singularName] &&
                elementSchemaImageFields[singularName].fields &&
                elementSchemaImageFields[singularName].fields.includes(key)
              ) {
                const image = element[key];
                if (image && image.url) {
                  addImage(image);
                }
              }
            }
          });
        } else {
          for (const key in fieldOrArray) {
            if (sectionSchemaImageFields[key]) {
              const image = fieldOrArray[key];
              if (image && image.path && image.url) {
                addImage(image);
              }
            }
          }
        }
      });
    }
  });
  // Get collection images
  builtData.contentTypes.forEach(contentType => {
    const contentTypeName = contentType.name;
    if (contentTypeSchemaImageFields[contentTypeName]) {
      contentTypeSchemaImageFields[contentTypeName].fields.forEach(field => {
        const collectionName = pluralize(contentTypeName);
        const dataArray = builtData.collections[collectionName];
        // Ensure `dataArray` is an array and iterate over it
        if (Array.isArray(dataArray)) {
          dataArray.forEach(item => {
            // Check if the object contains the field and the field has a path
            const image = item[field];
            if (image && image.path && image.url) {
              addImage(image);
            }
          });
        }
      });
    }
  });

  return images;
}

async function downloadAndSaveImages(
  images: {path: string; url: string}[],
  to: string
) {
  const publicPath = `./public`;
  const uploadsPath = path.resolve(to, publicPath);
  for (const image of images) {
    await downloadImage(image, uploadsPath);
  }
}

export async function updateImagesForThemeOrPlugin(
  themeOrPlugin: ThemeOrPlugin,
  frontendPath: string,
  builtData: BuiltData,
  type: string,
  isConfig?: boolean
) {
  await updateImages(builtData, frontendPath);
  if (type === 'theme' && themeOrPlugin.plugins) {
    for (const pluginNamespace of themeOrPlugin.plugins) {
      await updateImages(builtData, frontendPath, pluginNamespace, true);
    }
  }
}

export async function updateImages(
  builtData: BuiltData,
  projectRoot: string,
  namespace?: string,
  isPluginForTheme?: boolean
) {
  let pluginPath = '';
  if (isPluginForTheme) {
    pluginPath = `/plugins/${namespace}`;
  }

  // Define paths to the schema and data files
  const sectionsSchemaPath = path.join(
    projectRoot,
    `public/data${pluginPath}/schemas/sections.json`
  );
  const contentTypesSchemaPath = path.join(
    projectRoot,
    `public/data${pluginPath}/schemas/content-types.json`
  );
  const elementsSchemaPath = path.join(
    projectRoot,
    `public/data${pluginPath}/schemas/elements.json`
  );
  const globalSchemaPath = path.join(
    projectRoot,
    `public/data${pluginPath}/schemas/global.json`
  );

  // Required schemas: sections and contentTypes
  let sectionsSchema: Schema;
  let contentTypesSchema: Schema;

  try {
    sectionsSchema = (await readJsonFile(sectionsSchemaPath)) as Schema;
  } catch (error) {
    throw new Error(`Failed to load sections schema from ${sectionsSchemaPath}`);
  }

  try {
    contentTypesSchema = (await readJsonFile(
      contentTypesSchemaPath
    )) as Schema;
  } catch (error) {
    throw new Error(
      `Failed to load content types schema from ${contentTypesSchemaPath}`
    );
  }

  // Optional schemas: elements and global
  let elementsSchema: Schema | null = null;
  try {
    elementsSchema = (await readJsonFile(elementsSchemaPath)) as Schema;
  } catch (error) {
    // do nothing, elements are optional
  }

  let globalSchema: Schema | null = null;
  try {
    globalSchema = (await readJsonFile(globalSchemaPath)) as Schema;
  } catch (error) {
    // do nothing, global is optional
  }

  // Find image fields
  let globalSchemaImageFields: string[] | null = null;
  if (globalSchema?.global) {
    globalSchemaImageFields = findImageFieldsInGlobal(globalSchema.global);
  }

  const sectionSchemaImageFields = findImageFieldsInSections(
    sectionsSchema.sections
  );
  const contentTypeSchemaImageFields = findImageFieldsInContentTypes(
    contentTypesSchema.contentTypes
  );
  const elementSchemaImageFields = elementsSchema?.elements
    ? findImageFieldsInElements(elementsSchema.elements)
    : {};

  // Get image data
  const images = getImageDataFromBuilt(
    builtData,
    globalSchemaImageFields,
    sectionSchemaImageFields,
    contentTypeSchemaImageFields,
    elementSchemaImageFields
  );

  // Download and save images
  await downloadAndSaveImages(images, projectRoot);
}

