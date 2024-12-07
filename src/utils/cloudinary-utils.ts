import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

export async function initCloudinary(): Promise<boolean> {
  dotenv.config();
  
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return false;
  }
  
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
  
  return true;
}

export async function uploadToCloudinary(imagePath: string, publicId: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: 'builtjs'
    });
    return result.secure_url;
  } catch (error) {
    throw new Error(`Failed to upload image to Cloudinary: ${error instanceof Error ? error.message : String(error)}`);
  }
}