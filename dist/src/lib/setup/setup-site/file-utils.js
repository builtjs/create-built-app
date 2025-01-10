"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileSizeInBytes = getFileSizeInBytes;
exports.getFileData = getFileData;
exports.getFilesData = getFilesData;
exports.downloadImage = downloadImage;
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const fsp = fs_1.default.promises;
function ensureDirectoryExists(filePath) {
    const dir = path_1.default.dirname(filePath);
    try {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    }
    catch (err) {
        console.error(`Error creating directory ${dir}:`, err);
        throw err;
    }
}
async function downloadImage(image, uploadsPath) {
    return new Promise((resolve, reject) => {
        let fullPath = `${uploadsPath}/${image.path}`;
        https_1.default
            .get(image.url, response => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${image.url}. Status code: ${response.statusCode}`));
                return;
            }
            ensureDirectoryExists(fullPath);
            const writeStream = fs_1.default.createWriteStream(fullPath);
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
async function getFileSizeInBytes(filePath) {
    const stats = await fsp.stat(filePath);
    return stats.size;
}
async function getFileData(file) {
    const uploadsDirPath = `setup/uploads`;
    const uploadsPath = path_1.default.join(process.cwd(), uploadsDirPath);
    const fullPath = path_1.default.join(uploadsPath, file.path);
    const directoryPath = file.path.substring(0, file.path.lastIndexOf('/'));
    const fileName = file.path.substring(file.path.lastIndexOf('/') + 1, file.path.lastIndexOf('.'));
    const fileExtension = file.path.substring(file.path.lastIndexOf('.') + 1);
    if (!fs_1.default.existsSync(path_1.default.join(uploadsPath, directoryPath))) {
        await fsp.mkdir(path_1.default.join(uploadsPath, directoryPath), { recursive: true });
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
async function getFilesData(files) {
    const fileData = {};
    if (!files)
        return fileData;
    for (const [key, fileOrArray] of Object.entries(files)) {
        if (Array.isArray(fileOrArray)) {
            const fileDataArray = await Promise.all(fileOrArray
                .filter(file => Object.keys(file).length !== 0 && file.path) // Filter out empty objects
                .map(file => getFileData(file)));
            if (fileDataArray.length > 0) {
                fileData[key] = fileDataArray;
            }
        }
        else if (typeof fileOrArray === 'object' && fileOrArray !== null) {
            if (Object.keys(fileOrArray).length !== 0 &&
                fileOrArray.path &&
                fileOrArray.url) {
                const fileDataSingle = await getFileData(fileOrArray);
                if (Object.keys(fileDataSingle).length !== 0) {
                    fileData[key] = fileDataSingle;
                }
            }
        }
    }
    return fileData;
}
