import { default as axios } from 'axios';
import chalk from 'chalk';
import {
  getApiKey,
  promptForApiKey,
  validateApiKey,
  saveApiKeyToConfig,
} from '../lib/apiKeyUtils';
import * as fs from 'fs';
import * as path from 'path';
import {Constants} from '../constants';
import {getSrcDir} from '../utils';
import * as zlib from 'zlib';
import {CombinedData} from '../interfaces';

async function publish() {
  console.log(chalk.blue(`Publishing...`));
  const {combinedData, type} = await getCombinedData(true);
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

export function getCombinedData(
  collectFilesData: boolean
): Promise<{combinedData: CombinedData; type: string}> {
  return new Promise(resolve => {
    const publicDir = path.join(process.cwd(), 'public/data');
    const srcDir = getSrcDir();
    const componentsDir = `${srcDir}/components`;
    const libDir = `${srcDir}/lib`;
    const hooksDir = `${srcDir}/hooks`;
    const stylesDir = `${srcDir}/styles`;
    const apiDir = `${srcDir}/pages/api`;

    const jsonFiles = getAllFiles(publicDir).filter(file =>
      file.path.endsWith('.json')
    );
    const combinedData: CombinedData = {
      data: {},
      components: {},
      lib: {},
      hooks: {},
      styles: {},
      api: {},
      config: {},
    };

    collectData(publicDir, jsonFiles, combinedData.data, true);
    let type = null;
    if (combinedData.data['theme.json']) {
      type = Constants.TYPES.theme;
    } else if (combinedData.data['plugin.json']) {
      type = Constants.TYPES.plugin;
    } else {
      console.error(
        'Project is neither a theme nor plugin. No theme.json or plugin.json file found.'
      );
      process.exit(1);
    }
    if (!collectFilesData) {
      return resolve({combinedData, type});
    }

    const componentFiles = getAllFiles(componentsDir);
    collectData(componentsDir, componentFiles, combinedData.components);

    const libFiles = getAllFiles(libDir);
    collectData(libDir, libFiles, combinedData.lib);

    const hooksFiles = getAllFiles(hooksDir);
    collectData(hooksDir, hooksFiles, combinedData.hooks);

    const stylesFiles = getAllFiles(stylesDir);
    collectData(stylesDir, stylesFiles, combinedData.styles);

    const apiFiles = getAllFiles(apiDir);
    collectData(apiDir, apiFiles, combinedData.api);

    collectAllConfigData(combinedData, srcDir);
    return resolve({combinedData, type});
  });
}

function collectData(
  baseDir: string,
  files: FileObject[],
  targetObject: { [key: string]: any },
  isJson: boolean = false
): void {
  for (const file of files) {
    const result = getFile(baseDir, file);
    const { relativePath, fileContent } = result;
    if (!relativePath || !fileContent) {
      continue;
    }

    // Standardize the relative path
    const standardizedPath = path.posix.join(...relativePath.split(path.sep));
    targetObject[standardizedPath] = isJson ? JSON.parse(fileContent) : fileContent;
  }
}

function removeSubstringFromStart(str: string, substring: string): string {
  if (str.startsWith(substring)) {
    return str.slice(substring.length);
  }
  return str;
}

interface FileObject {
  path: string;
  required: boolean;
}

interface NodeJsError extends Error {
  code?: string;
}


function collectAllConfigData(data: CombinedData, srcDir: string) {
  const files = [
    { path: 'tailwind.config', required: true },
    { path: 'postcss.config', required: true },
    { path: 'next.config', required: true },
    { path: 'jsconfig.site.json', required: false },
    { path: '.env.example', required: false },
    { path: 'README.site.md', required: false },
    { path: `${srcDir}/pages/_app.tsx`, required: true },
    { path: `${srcDir}/pages/_document.tsx`, required: false },
  ];

  files.forEach(file =>
    collectConfigData(file, '', data, file.path.endsWith('.json'))
  );
}

function collectConfigData(
  file: FileObject,
  baseDir: string,
  targetObject: { [key: string]: any },
  isJson: boolean = false
): void {
  const result = getFile(baseDir, file);
  const { relativePath, fileContent } = result;

  if (!relativePath || !fileContent) {
    return;
  }

  targetObject.config[relativePath] = isJson
    ? JSON.parse(fileContent)
    : fileContent;
}

interface FileObject {
  path: string; // Path without extension (e.g., 'tailwind.config')
  required: boolean;
}

function getFile(baseDir: string, file: FileObject) {
  const absoluteBaseDir = path.resolve(baseDir);
  const extensions = ['.js', '.ts', '.json', '.md', '.tsx', 'example', '.css']; 
  const validExtensions = ['.js', '.ts']; 
  const fileExtension = path.extname(file.path); 
  const hasExtension = extensions.includes(fileExtension);
  let selectedPath: string | null = null;
  if (hasExtension) {
    // Directly check the provided path if it has a valid extension
    const absoluteFilePath = path.resolve(absoluteBaseDir, file.path);
    if (fs.existsSync(absoluteFilePath)) {
      selectedPath = absoluteFilePath;
    }
  } else {
    // Check for valid extensions if the file has no or an invalid extension
    for (const ext of validExtensions) {
      const absoluteFilePath = path.resolve(absoluteBaseDir, `${file.path}${ext}`);
      if (fs.existsSync(absoluteFilePath)) {
        selectedPath = absoluteFilePath;
        break;
      }
    }
  }

  if (!selectedPath) {
    if (file.required) {
      console.error(`Error: Required file not found: ${file.path}`);
      process.exit(1);
    }
    return { relativePath: null, fileContent: null };
  }

  let fileContent: string | null = null;
  try {
    fileContent = fs.readFileSync(selectedPath, 'utf8');
  } catch (error) {
    console.error(`Error: Unable to read file: ${selectedPath}`, error);
    if (file.required) process.exit(1);
  }

  const sanitizedPath = sanitizeFilePath(
    path.relative(absoluteBaseDir, selectedPath)
  );
  const relativePath = removeSubstringFromStart(sanitizedPath, 'src/');
  return { relativePath, fileContent };
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
    '.example',
  ];
  const fileExtension = path.extname(fileName).toLowerCase();
  return allowedExtensions.includes(fileExtension);
}

function isFileSizeValid(file: FileObject): boolean {
  try {
    const stats = fs.statSync(file.path);
    const maxSize = 5 * 1024 * 1024; // 5MB limit
    return stats.size <= maxSize;
  } catch (error) {
    const nodeError = error as NodeJsError;
    if (nodeError.code === 'ENOENT') {
      if (file.required) {
        console.error(`Error: Required file not found: ${file.path}`);
        process.exit(1);
      } else {
        return true;
      }
    } else {
      console.error(`Error: Unable to check file size: ${file.path}`, error);
      if (file.required) process.exit(1);
    }
    return false;
  }
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
      apiKey = await promptForApiKey();
    }
    await saveApiKeyToConfig(apiKey);

    try {
      const response = await axios.post(
        `${Constants.API_URL }/v${Constants.CURRENT_API_VERSION}/${type}s/publish`,
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
        console.log(chalk.green(
          `✓ Your ${type} has been ${
            response.data.action === 'create' ? 'published' : 'updated'
          } in Built Studio!`
        ));
        console.log(
          `View the ${type} at: ${chalk.blue(response.data.url)}`
        );
      } else {
        console.error(`Failed to publish ${type}.`);
      }
    } catch (error: any) {
      console.error('Failed to publish:', error.message);

      if (error.response) {
        if (error.response.data.message) {
          let msg = error.response.data.message;
          // if (error.response.data.docsUrl) {
          //   msg += `. Find out more at https://docs.builtjs.com/${error.response.data.docsUrl}`;
          // }
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

function getAllFiles(
  dirPath: string,
  files: FileObject[] = [],
  required: boolean = false
): FileObject[] {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.resolve(path.join(dirPath, entry.name));
      if (entry.isDirectory()) {
        getAllFiles(fullPath, files);
      } else if (entry.isFile()) {
        files.push({
          path: fullPath,
          required: true,
        });
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
