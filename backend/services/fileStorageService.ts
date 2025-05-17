// backend/services/fileStorageService.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';
import { admin } from '../firebase';
import sharp from 'sharp';

const bucket = admin.storage().bucket();
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

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
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
    
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
  try {
    // Extract filename from URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filepath = pathname.replace(`/storage/v1/b/${bucket.name}/o/`, '').split('?')[0];
    
    // Delete file from Firebase Storage
    await bucket.file(filepath).delete();
    
    return true;
  } catch (error) {
    console.error('Error deleting image from storage:', error);
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