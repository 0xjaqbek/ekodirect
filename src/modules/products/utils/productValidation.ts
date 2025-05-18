// src/modules/products/utils/productValidation.ts
import { z } from 'zod';
import { PRODUCT_CATEGORIES, PRODUCT_SUBCATEGORIES, PRODUCT_UNITS, VALIDATION } from '../../../shared/constants';

// Schema for product creation/update
export const productSchema = z.object({
  name: z.string().min(3, 'Nazwa produktu musi mieć co najmniej 3 znaki').max(100, 'Nazwa produktu nie może przekraczać 100 znaków'),
  description: z.string().min(10, 'Opis produktu musi mieć co najmniej 10 znaków').max(2000, 'Opis produktu nie może przekraczać 2000 znaków'),
  price: z.number().positive('Cena musi być liczbą dodatnią').min(0.01, 'Minimalna cena to 0.01 PLN'),
  quantity: z.number().int('Ilość musi być liczbą całkowitą').positive('Ilość musi być liczbą dodatnią'),
  unit: z.enum(PRODUCT_UNITS),
  category: z.enum(PRODUCT_CATEGORIES),
  subcategory: z.string().optional(),
  certificates: z.array(z.string()).optional(),
  location: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
    address: z.string().min(1, 'Adres jest wymagany')
  }).optional(),
  harvestDate: z.date().optional(),
  images: z.array(z.any()).max(VALIDATION.MAX_IMAGES_PER_PRODUCT, `Maksymalna liczba zdjęć to ${VALIDATION.MAX_IMAGES_PER_PRODUCT}`).optional(),
});

// Type for product form inputs
export type ProductFormInputs = z.infer<typeof productSchema>;

// Schema for product image upload
export const productImageSchema = z.object({
  images: z.array(z.any())
    .max(VALIDATION.MAX_IMAGES_PER_PRODUCT, `Maksymalna liczba zdjęć to ${VALIDATION.MAX_IMAGES_PER_PRODUCT}`)
    .refine((files) => {
      if (!files || files.length === 0) return true;
      return Array.from(files).every(file => 
        VALIDATION.ALLOWED_IMAGE_TYPES.includes((file as File).type)
      );
    }, 'Dozwolone są tylko pliki JPG, PNG i WebP')
    .refine((files) => {
      if (!files || files.length === 0) return true;
      return Array.from(files).every(file => 
        (file as File).size <= VALIDATION.MAX_FILE_SIZE_MB * 1024 * 1024
      );
    }, `Maksymalny rozmiar pliku to ${VALIDATION.MAX_FILE_SIZE_MB} MB`)
});

// Type for product image form inputs
export type ProductImageInputs = z.infer<typeof productImageSchema>;

/**
 * Validate product data
 */
export const validateProductData = (data: ProductFormInputs): { 
  isValid: boolean;
  errors?: Record<string, string>;
} => {
  try {
    productSchema.parse(data);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { form: 'Nieprawidłowe dane formularza' } };
  }
};

/**
 * Validate subcategory based on category
 */
export const validateSubcategory = (category: string, subcategory: string): boolean => {
  if (!category || !subcategory) return false;
  
  const availableSubcategories = PRODUCT_SUBCATEGORIES[category] || [];
  return availableSubcategories.includes(subcategory);
};

/**
 * Prepare form data for API submission
 */
export const prepareProductFormData = (data: ProductFormInputs, images?: File[]): FormData => {
  const formData = new FormData();
  
  // Add basic product data
  formData.append('name', data.name);
  formData.append('description', data.description);
  formData.append('price', data.price.toString());
  formData.append('quantity', data.quantity.toString());
  formData.append('unit', data.unit);
  formData.append('category', data.category);
  
  if (data.subcategory) {
    formData.append('subcategory', data.subcategory);
  }
  
  // Add certificates if any
  if (data.certificates && data.certificates.length > 0) {
    data.certificates.forEach((cert, index) => {
      formData.append(`certificates[${index}]`, cert);
    });
  }
  
  // Add location if provided
  if (data.location) {
    formData.append('location.type', 'Point');
    formData.append('location.coordinates[0]', data.location.coordinates[0].toString());
    formData.append('location.coordinates[1]', data.location.coordinates[1].toString());
    formData.append('location.address', data.location.address);
  }
  
  // Add harvest date if provided
  if (data.harvestDate) {
    formData.append('harvestDate', data.harvestDate.toISOString());
  }
  
  // Add images if provided
  if (images && images.length > 0) {
    images.forEach(image => {
      formData.append('images', image);
    });
  }
  
  return formData;
};