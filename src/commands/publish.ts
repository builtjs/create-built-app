import axios from 'axios';
import {
  getApiKey, 
  promptForApiKey,
  validateApiKey,
  saveApiKeyToConfig
} from '../lib/apiKeyUtils';
import * as fs from 'fs';
import * as path from 'path';
import {Constants} from '../constants';
import {getSrcDir} from '../utils';
import * as zlib from 'zlib';

interface CombinedData {
  data: Record<string, any>;
  components: Record<string, string>;
  lib: Record<string, string>;
  styles: Record<string, string>;
  api: Record<string, string>;
}

async function publish(options: any) {
  let {type = 'theme'} = options;
  if (
    !type ||
    type === Constants.TYPES.theme ||
    type === Constants.TYPES.plugin
  ) {

    const publicDir = path.join(process.cwd(), 'public/data');
    if (!fs.existsSync(publicDir)) {
      console.error('The public directory does not exist.');
      process.exit(1);
    }

    const srcDir = getSrcDir();
    const componentsDir = `${srcDir}/components`;
    const libDir = `${srcDir}/lib`;
    const stylesDir = `${srcDir}/styles`;
    const apiDir = `${srcDir}/page/api`;

    const jsonFiles = getAllFiles(publicDir).filter(file =>
      file.endsWith('.json')
    );
    const combinedData: CombinedData = {
      data: {},
      components: {},
      lib: {},
      styles: {},
      api: {}
    };

    // Collect data
    collectData(publicDir, jsonFiles, combinedData.data, true);

    const componentFiles = getAllFiles(componentsDir);
    collectData(componentsDir, componentFiles, combinedData.components);

    const libFiles = getAllFiles(libDir);
    collectData(libDir, libFiles, combinedData.lib);

    const stylesFiles = getAllFiles(stylesDir);
    collectData(stylesDir, stylesFiles, combinedData.styles);

    const apiFiles = getAllFiles(apiDir);
    collectData(apiDir, apiFiles, combinedData.api);

    // Compress combinedData before sending
    const compressedData = compressData(combinedData);

    try {
      await sendRequest(type, compressedData);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to upload data and components:', error.message);
      } else {
        console.error('Failed to upload data and components:', error);
      }
    }
  }
}

// function collectData(
//   baseDir: string,
//   files: string[],
//   targetObject: {[key: string]: any},
//   isJson: boolean = false
// ): void {
//   for (const file of files) {
//     let {relativePath, fileContent} = getFile(baseDir, file);
//     if(!relativePath || !fileContent){
//       continue;
//     }
//     // const relativePath = sanitizeFilePath(path.relative(baseDir, file));
//     // if (!isValidFileType(relativePath) || !isFileSizeValid(file)) {
//     //   console.warn(`Skipping invalid or large file: ${relativePath}`);
//     //   continue;
//     // }
//     // const fileContent = fs.readFileSync(file, 'utf8');
//     targetObject[relativePath] = isJson ? JSON.parse(fileContent) : fileContent;
//   }
// }

function collectData(
  baseDir: string,
  files: string[],
  targetObject: {[key: string]: any},
  isJson: boolean = false
): void {
  for (const file of files) {
    const result = getFile(baseDir, file);
    if (!result) {
      continue;
    }
    const {relativePath, fileContent} = result;
    targetObject[relativePath] = isJson ? JSON.parse(fileContent) : fileContent;
  }
}

function getFile(baseDir: string, file: any) {
  const relativePath = sanitizeFilePath(path.relative(baseDir, file));
  if (!isValidFileType(relativePath) || !isFileSizeValid(file)) {
    console.warn(`Skipping invalid or large file: ${relativePath}`);
    return null;
  }
  let fileContent = null;
  try {
    fileContent = fs.readFileSync(file, 'utf8');
  } catch (error) {
    console.error(`Error: Unable to read directory: ${file}`);
    process.exit(1);
  }

  return {relativePath, fileContent};
}

function sanitizeFilePath(filePath: string): string {
  return path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
}

function isValidFileType(fileName: string): boolean {
  const allowedExtensions = [
    '.json',
    '.js',
    '.css',
    '.ts',
    '.jsx',
    '.tsx',
    '.md',
  ];
  const fileExtension = path.extname(fileName).toLowerCase();
  return allowedExtensions.includes(fileExtension);
}

function isFileSizeValid(filePath: string): boolean {
  const stats = fs.statSync(filePath);
  const maxSize = 5 * 1024 * 1024; // 5MB limit
  return stats.size <= maxSize;
}

function compressData(data: CombinedData): Buffer {
  const jsonData = JSON.stringify(data);
  const compressedData = zlib.gzipSync(jsonData);
  return compressedData;
}

export async function sendRequest(type: string, data: Buffer): Promise<void> {
  try {
    let apiKey = await getApiKey();
  if (!apiKey) {
    console.error('Unable to process API key.');
    process.exit(1);
  }

  const isValid = await validateApiKey(apiKey);
  if (!isValid) {
    console.error('Invalid API key.');
    process.exit(1);
  }
  await saveApiKeyToConfig(apiKey);

    try {
      const response = await axios.post(
        `${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/${type}s/publish`,
        data,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'gzip',
            'x-api-key': apiKey,
          },
        }
      );

      if (response.data && response.data.success && response.data.url) {
        console.log(
          `Your ${type} has been ${
            response.data.action === 'create' ? 'published' : 'updated'
          } in Built Studio!\nView the plugin at: ${response.data.url}`
        );
      } else {
        console.error(`Failed to publish ${type}.`);
      }
    } catch (error: any) {
      console.error('Failed to publish:', error.message);

      if (error.response) {
        if (error.response.data.message) {
          let msg = error.response.data.message;
          if (error.response.data.docsUrl) {
            msg += ` Find out more at ${error.response.data.docsUrl}.`;
          }
          console.error(msg);

          if (error.response.data.message === 'Invalid API key') {
            apiKey = await promptForApiKey();
          }
        }
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
// export async function sendRequest(type: string, data: Buffer): Promise<void> {
//   try {
//     let apiKey = await readApiKeyFromConfig();

//     if (!apiKey) {
//       apiKey = await promptForApiKey();
//     }
//     console.log('Sending request to',`${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/${type}s/publish`)
//     console.log({data})
//     try {
//       const response = await axios.post(
//         `${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/${type}s/publish`,
//         { data, apiKey },
//         {
//           headers: {
//             'Content-Type': 'application/gzip',
//             'Content-Encoding': 'gzip',
//           },
//         }
//       );
//       if (response.data && response.data.success && response.data.url) {
//         console.log(
//           `Your plugin has been ${
//             response.data.action === 'create' ? 'published' : 'updated'
//           } in Built Studio!\nView the plugin at: ${response.data.url}`
//         );
//       }else{
//         console.error(`Failed to publish.`);
//       }
//       // const gzippedData = zlib.gzipSync(JSON.stringify({ data, apiKey }));
//       console.log({data})
//     // axios
//     //   .post(
//     //     `${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/${type}s/publish`,
//     //     {data:data, apiKey:apiKey},
//     //     {
//     //       headers: {
//     //         'Content-Type': 'application/gzip',
//     //         'Content-Encoding': 'gzip',
//     //     // 'Content-Length': gzippedData.length,
//     //       },
//     //     }
//     //   )
//     //   .then(response => {
//     //     if (response.data && response.data.success && response.data.url) {
//     //       console.log(
//     //         `Your plugin has been ${
//     //           response.data.action === 'create' ? 'published' : 'updated'
//     //         } in Built Studio!\nView the plugin at: ${response.data.url}`
//     //       );
//     //     }
//     //   })
//     //   .catch(error => {
//     //     console.error('Error sending data:', error);
//     //   });
//     } catch (error: any) {
//       console.error(`Failed to publish:`, error.message);

//       if (error.response) {
//         if(error.response.data.message){
//           let msg = error.response.data.message;
//           if(error.response.data.docsUrl){
//             msg += ` Find out more at ${error.response.data.docsUrl}.`;
//           }
//           console.error(msg);
//           if(error.response.data.message === 'Invalid API key'){
//             apiKey = await promptForApiKey();
//           }
//         }
//       }
//       process.exit(1);
//     }
//   } catch (error) {
//     console.error('Error:', error);
//   }
// }

function getAllFiles(
  dirPath: string,
  files: string[] = [],
  required: boolean = false
): string[] {
  try {
    const entries = fs.readdirSync(dirPath, {withFileTypes: true});
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        getAllFiles(fullPath, files);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    if (required) {
      console.error(`Error: Unable to read directory: ${dirPath}`);
      process.exit(1);
    }
    return [];
  }

  return files;
}

export {publish};

// import axios from 'axios';
// import * as fs from 'fs';
// import * as path from 'path';
// import { Constants } from '../constants';

// interface CombinedData {
//   data: Record<string, any>;
//   components: Record<string, string>;
//   lib: Record<string, string>;
//   styles: Record<string, string>;
//   api: Record<string, string>;
// }

// async function publish(options: any) {
//   let { type = 'theme' } = options;
//   if (!type || type === Constants.TYPES.theme || type === Constants.TYPES.plugin) {
//     const publicDir = path.join(process.cwd(), 'public/data');
//     if (!fs.existsSync(publicDir)) {
//       console.error('The public directory does not exist.');
//       process.exit(1);
//     }
//     const componentsDir = getSrcDir(['components']);
//     const libDir = getSrcDir(['lib']);
//     const stylesDir = getSrcDir(['styles']);
//     const apiDir = getSrcDir(['pages', 'api']);

//     const jsonFiles = getAllFiles(publicDir).filter(file => file.endsWith('.json'));
//     const componentFiles = getAllFiles(componentsDir);
//     const libFiles = getAllFiles(libDir);
//     const stylesFiles = getAllFiles(stylesDir);
//     const apiFiles = getAllFiles(apiDir);

//     const combinedData: CombinedData = {
//       data: {},
//       components: {},
//       lib: {},
//       styles: {},
//       api: {}
//     };

//     // Collect data
//     collectData(publicDir, jsonFiles, combinedData.data, true);
//     collectData(componentsDir, componentFiles, combinedData.components);
//     collectData(libDir, libFiles, combinedData.lib);
//     collectData(stylesDir, stylesFiles, combinedData.styles);
//     collectData(apiDir, apiFiles, combinedData.api);

//     try {
//       await sendRequest(type, combinedData);
//     } catch (error) {
//       if (error instanceof Error) {
//         console.error('Failed to upload data and components:', error.message);
//       } else {
//         console.error('Failed to upload data and components:', error);
//       }
//     }
//   }
// }

// function getSrcDir(pathSegments: string[]): string {
//   const dirs = [
//     path.join(process.cwd(), ...pathSegments),
//     path.join(process.cwd(), 'src', ...pathSegments),
//   ];

//   let directory: string | undefined;
//   for (const dir of dirs) {
//     if (fs.existsSync(dir)) {
//       directory = dir;
//       break;
//     }
//   }
//   if (!directory) {
//     console.error('The components directory does not exist.');
//     process.exit(1);
//   }
//   return directory;
// }

// function collectData(
//   baseDir: string,
//   files: string[],
//   targetObject: { [key: string]: any },
//   isJson: boolean = false
// ): void {
//   for (const file of files) {
//     const relativePath = sanitizeFilePath(path.relative(baseDir, file));
//     if (!isValidFileType(relativePath) || !isFileSizeValid(file)) {
//       console.warn(`Skipping invalid or large file: ${relativePath}`);
//       continue;
//     }
//     const fileContent = fs.readFileSync(file, 'utf8');
//     targetObject[relativePath] = isJson ? JSON.parse(fileContent) : fileContent;
//   }
// }

// function sanitizeFilePath(filePath: string): string {
//   return path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
// }

// function isValidFileType(fileName: string): boolean {
//   const allowedExtensions = ['.json', '.js', '.css', '.ts', '.jsx', '.tsx', '.md'];
//   const fileExtension = path.extname(fileName).toLowerCase();
//   return allowedExtensions.includes(fileExtension);
// }

// function isFileSizeValid(filePath: string): boolean {
//   const stats = fs.statSync(filePath);
//   const maxSize = 5 * 1024 * 1024; // 5MB limit
//   return stats.size <= maxSize;
// }

// export async function sendRequest(
//   type: String,
//   data: CombinedData
// ): Promise<void> {
//   try {
//     const response = await axios.post(
//       `${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/${type}s/publish`,
//       { data: data },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           // 'Authorization': `Bearer ${yourAuthToken}` // Ensure yourAuthToken is securely managed
//         },
//       }
//     );

//     if (response.status === 200) {
//       console.log('Successfully uploaded files.');
//     } else {
//       throw new Error(`Failed with status code: ${response.status}`);
//     }
//   } catch (error) {
//     if (axios.isAxiosError(error) && error.response) {
//       throw new Error(
//         `Failed with status code: ${
//           error.response.status
//         }, response: ${JSON.stringify(error.response.data)}`
//       );
//     } else {
//       throw error;
//     }
//   }
// }

// function getAllFiles(dirPath: string, files: string[] = []): string[] {
//   const entries = fs.readdirSync(dirPath, { withFileTypes: true });

//   for (const entry of entries) {
//     const fullPath = path.join(dirPath, entry.name);
//     if (entry.isDirectory()) {
//       getAllFiles(fullPath, files);
//     } else if (entry.isFile()) {
//       files.push(fullPath);
//     }
//   }

//   return files;
// }

// export { publish };
