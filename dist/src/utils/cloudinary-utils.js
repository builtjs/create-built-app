"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCloudinary = initCloudinary;
exports.uploadToCloudinary = uploadToCloudinary;
const cloudinary_1 = require("cloudinary");
const dotenv_1 = __importDefault(require("dotenv"));
async function initCloudinary() {
    dotenv_1.default.config();
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        return false;
    }
    cloudinary_1.v2.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
    });
    return true;
}
async function uploadToCloudinary(imagePath, publicId) {
    try {
        const result = await cloudinary_1.v2.uploader.upload(imagePath, {
            public_id: publicId,
            folder: 'builtjs'
        });
        return result.secure_url;
    }
    catch (error) {
        throw new Error(`Failed to upload image to Cloudinary: ${error instanceof Error ? error.message : String(error)}`);
    }
}
