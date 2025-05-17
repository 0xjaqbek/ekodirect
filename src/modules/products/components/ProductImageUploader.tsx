// src/modules/products/components/ProductImageUploader.tsx
import React, { useState, useRef } from 'react';
import { VALIDATION } from '../../../shared/constants';

interface ProductImageUploaderProps {
  images: File[];
  onChange: (files: File[]) => void;
  existingImages?: string[];
  maxImages?: number;
  className?: string;
}

const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  images,
  onChange,
  existingImages = [],
  maxImages = VALIDATION.MAX_IMAGES_PER_PRODUCT,
  className = ''
}) => {
  const [error, setError] = useState<string | null>(null);
  const [localImages, setLocalImages] = useState<File[]>(images);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    const selectedFiles = Array.from(e.target.files || []);
    
    // Check file count - both new files and existing
    const totalCount = selectedFiles.length + localImages.length + existingImages.length;
    if (totalCount > maxImages) {
      setError(`Możesz dodać maksymalnie ${maxImages} zdjęć`);
      return;
    }
    
    // Validate file size and type
    const invalidFiles = selectedFiles.filter(file => {
      // Check file size
      if (file.size > VALIDATION.MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Plik ${file.name} jest za duży. Maksymalny rozmiar to ${VALIDATION.MAX_FILE_SIZE_MB}MB`);
        return true;
      }
      
      // Check file type
      if (!VALIDATION.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError('Dozwolone są tylko pliki JPG, PNG lub WebP');
        return true;
      }
      
      return false;
    });
    
    if (invalidFiles.length > 0) {
      return;
    }
    
    // Create preview URLs for new files
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    
    // Update state
    const updatedImages = [...localImages, ...selectedFiles];
    setLocalImages(updatedImages);
    setPreviewUrls([...previewUrls, ...newPreviews]);
    
    // Notify parent component
    onChange(updatedImages);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove an image
  const removeImage = (index: number) => {
    // Create new arrays without the removed image
    const updatedImages = [...localImages];
    const updatedPreviews = [...previewUrls];
    
    // Release URL object to prevent memory leaks
    if (updatedPreviews[index]) {
      URL.revokeObjectURL(updatedPreviews[index]);
    }
    
    // Remove items at index
    updatedImages.splice(index, 1);
    updatedPreviews.splice(index, 1);
    
    // Update state
    setLocalImages(updatedImages);
    setPreviewUrls(updatedPreviews);
    
    // Notify parent component
    onChange(updatedImages);
    
    // Clear error if we're now under the limit
    if (error && error.includes('maksymalnie')) {
      setError(null);
    }
  };
  
  // Remove existing image
  const removeExistingImage = (index: number) => {
    // We would typically send a request to the API here to remove the image from the server
    // For now, just update the existingImages array locally
    const event = new CustomEvent('removeProductImage', {
      detail: { imageUrl: existingImages[index] }
    });
    window.dispatchEvent(event);
  };
  
  return (
    <div className={className}>
      {/* Image previews */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        {/* Existing images */}
        {existingImages.map((url, index) => (
          <div key={`existing-${index}`} className="relative group aspect-square bg-gray-100 rounded-md overflow-hidden">
            <img
              src={url}
              alt={`Product image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => removeExistingImage(index)}
                className="bg-red-500 text-white p-2 rounded-full"
              >
                <svg 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
        
        {/* New images */}
        {localImages.map((_, index) => (
          <div key={`new-${index}`} className="relative group aspect-square bg-gray-100 rounded-md overflow-hidden">
            <img
              src={previewUrls[index]}
              alt={`Product image ${existingImages.length + index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="bg-red-500 text-white p-2 rounded-full"
              >
                <svg 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
        
        {/* Add image */}
        {(localImages.length + existingImages.length) < maxImages && (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-md aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg 
              className="h-10 w-10 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
              />
            </svg>
            <span className="mt-2 text-sm text-gray-500">Dodaj zdjęcie</span>
          </div>
        )}
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={VALIDATION.ALLOWED_IMAGE_TYPES.join(',')}
        multiple
        onChange={handleFileChange}
      />
      
      {/* File upload button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Wybierz zdjęcia
      </button>
      
      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {/* Help text */}
      <p className="mt-2 text-xs text-gray-500">
        Możesz dodać maksymalnie {maxImages} zdjęć. Dozwolone formaty: JPG, PNG, WebP. Maksymalny rozmiar: {VALIDATION.MAX_FILE_SIZE_MB}MB.
      </p>
      
      {/* Image count indicator */}
      <p className="mt-1 text-xs text-gray-500">
        {localImages.length + existingImages.length} z {maxImages} zdjęć
      </p>
    </div>
  );
};

export default ProductImageUploader;