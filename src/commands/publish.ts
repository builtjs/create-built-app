import axios from 'axios';
import * as colors from 'colors';
import * as fs from 'fs';
import * as path from 'path';
import {Constants} from '../constants';
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
    const componentsDir = getSrcDir(['components']);
    const libDir = getSrcDir(['lib']);
    const stylesDir = getSrcDir(['styles']);
    const apiDir = getSrcDir(['pages', 'api']);

    const jsonFiles = getAllFiles(publicDir).filter(file =>
      file.endsWith('.json')
    );
    const componentFiles = getAllFiles(componentsDir);
    const libFiles = getAllFiles(libDir);
    const stylesFiles = getAllFiles(stylesDir);
    const apiFiles = getAllFiles(apiDir);

    const combinedData: CombinedData = {
      data: {},
      components: {},
      lib: {},
      styles: {},
      api: {},
    };

    // Collect data
    collectData(publicDir, jsonFiles, combinedData.data, true);
    collectData(componentsDir, componentFiles, combinedData.components);
    collectData(libDir, libFiles, combinedData.lib);
    collectData(stylesDir, stylesFiles, combinedData.styles);
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

function getSrcDir(pathSegments: string[]): string {
  const dirs = [
    path.join(process.cwd(), ...pathSegments),
    path.join(process.cwd(), 'src', ...pathSegments),
  ];

  let directory: string | undefined;
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      directory = dir;
      break;
    }
  }
  if (!directory) {
    console.error('The components directory does not exist.');
    process.exit(1);
  }
  return directory;
}

function collectData(
  baseDir: string,
  files: string[],
  targetObject: {[key: string]: any},
  isJson: boolean = false
): void {
  for (const file of files) {
    const relativePath = sanitizeFilePath(path.relative(baseDir, file));
    if (!isValidFileType(relativePath) || !isFileSizeValid(file)) {
      console.warn(`Skipping invalid or large file: ${relativePath}`);
      continue;
    }
    const fileContent = fs.readFileSync(file, 'utf8');
    targetObject[relativePath] = isJson ? JSON.parse(fileContent) : fileContent;
  }
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
  // const d = JSON.stringify({key: 'value', anotherKey: 'anotherValue'});

  // zlib.gzip(d, async (err, compressedData) => {
  //   if (err) {
  //     console.error('Error gzipping data:', err);
  //     return;
  //   }

  //   try {
  //     const response = await axios.post(
  //       `${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/${type}s/publish`,
  //       compressedData,
  //       {
  //         headers: {
  //           'Content-Type': 'application/gzip',
  //           'Content-Encoding': 'gzip',
  //           'Content-Length': compressedData.length,
  //           'x-name': 'test-name',
  //         },
  //       }
  //     );

  //     console.log('Server response:', response.data);
  //   } catch (error) {
  //     console.error('Error sending gzipped data:', error);
  //   }
  // });



  

  // try {
  //   let d = {
  //     key: 'value',
  //     anotherKey: 'anotherValue',
  //   };
  //   const compressedData = zlib.gzipSync(JSON.stringify(d));
  //   const response = await axios.post(
  //     `${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/${type}s/publish`,
  //     compressedData,
  //     // zlib.gzipSync(JSON.stringify({
  //     //   key: 'value',
  //     //   anotherKey: 'anotherValue'
  //     // })),
  //     //data,
  //     {
  //       headers: {
  //         'Content-Type': 'application/gzip',
  //         'Content-Encoding': 'gzip',
  //         'Content-Length': compressedData.length,
  //         // 'Authorization': `Bearer ${yourAuthToken}` // Ensure yourAuthToken is securely managed
  //         'x-name': 'test-name',
  //       },
  //     }
  //   );

  //   if (response.status === 200) {
  //     console.log('Successfully uploaded files.');
  //   } else {
  //     throw new Error(`Failed with status code: ${response.status}`);
  //   }
  // } catch (error) {
  //   if (axios.isAxiosError(error) && error.response) {
  //     throw new Error(
  //       `Failed with status code: ${
  //         error.response.status
  //       }, response: ${JSON.stringify(error.response.data)}`
  //     );
  //   } else {
  //     throw error;
  //   }
  // }



  // try {
  //   const data = {
  //     key: 'value',
  //     anotherKey: 'anotherValue',
  //   };

  //   const compressedData = zlib.gzipSync(JSON.stringify(data));

  //   const response = await axios.post(
  //     `${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/${type}s/publish`,
  //     compressedData,
  //     {
  //       headers: {
  //         'Content-Type': 'application/gzip',
  //         'Content-Encoding': 'gzip',
  //         'Content-Length': compressedData.length,
  //         'x-name': 'test-name',
  //       },
  //     }
  //   );

  //   if (response.status === 200) {
  //     console.log('Successfully uploaded files.');
  //   } else {
  //     throw new Error(`Failed with status code: ${response.status}`);
  //   }
  // } catch (error) {
  //   if (axios.isAxiosError(error) && error.response) {
  //     throw new Error(
  //       `Failed with status code: ${
  //         error.response.status
  //       }, response: ${JSON.stringify(error.response.data)}`
  //     );
  //   } else {
  //     throw error;
  //   }
  // }


//   const d = {
//     key: 'value',
//     anotherKey: 'anotherValue',
//   };

//   // Compress the data
//   const compressedData = zlib.gzipSync(JSON.stringify(d));

//   console.log('Compressed data:', compressedData);
// // Write compressed data to a file for manual verification
// fs.writeFileSync('compressedData.gz', compressedData);
//   try {
//     const response = await axios.post(
//       `${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/${type}s/publish`, // Update with your server URL
//       compressedData,
//       {
//         headers: {
//           'Content-Type': 'application/gzip',
//           'Content-Encoding': 'gzip',
//           'Content-Length': compressedData.length,
//           'x-name': 'test-name',
//         },
//       }
//     );

//     console.log('Successfully uploaded files.');
//   } catch (error) {
//     console.error('Error sending data:', error);
//   }

// try {
//   let d = {
//     key: 'value',
//     anotherKey: 'anotherValue',
//   };
//   const compressedData = zlib.gzipSync(JSON.stringify(d));

//   console.log('Compressed data:', compressedData);

//   const response = await axios.post(
//     'http://localhost/v1.2/plugins/publish',
//     compressedData,
//     {
//       headers: {
//         'Content-Type': 'application/gzip',
//         'Content-Encoding': 'gzip',
//         'Content-Length': compressedData.length,
//       },
//     }
//   );

//   console.log('Response:', response.data);
// } catch (error) {
//   console.error('Error:', error);
// }


try {
  // const data = JSON.stringify({ key: 'value' }); // Example JSON data

  // Gzip the data
  // zlib.gzip(data, (err, gzippedData) => {
  //   if (err) {
  //     console.error('Error gzipping data:', err);
  //   } else {
      // Send gzipped data to the server
      axios.post(`${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/${type}s/publish`, data, {
        headers: {
          'Content-Type': 'application/gzip', // Original MIME type of the data
          'Content-Encoding': 'gzip', // Indicating the data is gzipped
        }
      })
      .then(response => {
        console.log('Server response:', response.data);
        if(response.data && response.data.success && response.data.url){
          console.log(`Your plugin has been ${response.data.action === 'create' ? 'published' : 'updated'} in Built Studio!\nView the plugin at: ${colors.blue.underline(response.data.url)}\n`);
        }
      })
      .catch(error => {
        console.error('Error sending data:', error);
      });
    // }
  // });



//   let data = {
//     key: 'value',
//     anotherKey: 'anotherValue',
//   };
//   const compressedData = zlib.gzipSync(JSON.stringify(data));
//   const base64Data = compressedData.toString('base64');

//   console.log('Base64 Compressed data:', base64Data);

//   const response = await axios.post(
//     `${Constants.API_URL}/v${Constants.CURRENT_API_VERSION}/${type}s/publish`,
//     base64Data,
//     {
//       headers: {
//         'Content-Type': 'application/gzip',
//         'Content-Encoding': 'gzip',
//         'Content-Length': Buffer.byteLength(base64Data),
//       },
//     }
//   );

//   console.log('Response:', response.data);
} catch (error) {
  console.error('Error:', error);
}
}

function getAllFiles(dirPath: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dirPath, {withFileTypes: true});

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
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
