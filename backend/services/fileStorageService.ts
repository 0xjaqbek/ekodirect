// backend/services/fileStorageService.ts - Fixed with proper bucket handling
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import { getBucket } from '../firebase.js';
import sharp from 'sharp';
import os from 'os';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

// Get bucket instance with error handling
let bucket: any = null;

try {
  bucket = getBucket();
} catch (error) {
  console.warn('Storage bucket not available:', error);
  console.warn('File upload features will be disabled');
}

/**
 * Upload an image to Firebase Storage
 * @param file File object from Multer
 * @param folder Folder to store the file in (e.g., 'products', 'avatars')
 * @returns URL of the uploaded file
 */
export const uploadImageToStorage = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<string> => {
  if (!bucket) {
    throw new Error('Storage bucket not configured. File upload is not available.');
  }

  try {
    // Generate a unique filename
    const filename = generateUniqueFilename(file.originalname);
    const filepath = path.join(os.tmpdir(), filename);

    // Process image with Sharp to optimize it
    const processedImage = await processImage(file.buffer);
    
    // Write the file to local temp storage
    await writeFile(filepath, processedImage);
    
    // Destination path in Firebase Storage
    const destination = `${folder}/${filename}`;
    
    // Upload file to Firebase Storage
    await bucket.upload(filepath, {
      destination,
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalname: file.originalname
        }
      }
    });
    
    // Delete the temp file
    await unlink(filepath);
    
    // Make the file publicly accessible
    const fileRef = bucket.file(destination);
    await fileRef.makePublic();
    
    // Get the file's public URL
    const bucketName = bucket.name;
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image to storage:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Process image to optimize it before uploading
 * @param buffer Image buffer
 * @returns Processed image buffer
 */
const processImage = async (buffer: Buffer): Promise<Buffer> => {
  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Only resize if the image is too large
    if (metadata.width && metadata.width > 1920) {
      return await sharp(buffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .toBuffer();
    }
    
    // Optimize JPEG/PNG images
    if (metadata.format === 'jpeg' || metadata.format === 'png') {
      return await sharp(buffer)
        .toFormat(metadata.format, { quality: 85 })
        .toBuffer();
    }
    
    // Return original buffer if no processing needed
    return buffer;
  } catch (error) {
    console.error('Error processing image:', error);
    return buffer; // Return original buffer on error
  }
};

/**
 * Delete an image from Firebase Storage
 * @param url URL of the image to delete
 * @returns Whether the deletion was successful
 */
export const deleteImageFromStorage = async (url: string): Promise<boolean> => {
  if (!bucket) {
    console.warn('Storage bucket not configured. Cannot delete image.');
    return false;
  }

  try {
    // Extract filename from URL
    const decodedUrl = decodeURIComponent(url);
    const bucketName = bucket.name;
    const baseUrl = `https://storage.googleapis.com/${bucketName}/`;
    
    if (!decodedUrl.startsWith(baseUrl)) {
      console.warn('URL does not match expected bucket URL format');
      return false;
    }
    
    const filePath = decodedUrl.replace(baseUrl, '').split('?')[0];
    
    // Delete file from Storage
    await bucket.file(filePath).delete();
    
    return true;
  } catch (deleteError) {
    console.error('Error deleting image from storage:', deleteError);
    return false;
  }
};

/**
 * Generate a unique filename
 * @param originalname Original filename
 * @returns Unique filename
 */
const generateUniqueFilename = (originalname: string): string => {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalname);
  
  return `${timestamp}-${randomStr}${extension}`;
};

/**
 * Check if storage is available
 * @returns Whether storage is configured and available
 */
export const isStorageAvailable = (): boolean => {
  return bucket !== null;
};