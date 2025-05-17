// src/modules/products/components/ProductForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import { 
  PRODUCT_CATEGORIES, 
  PRODUCT_SUBCATEGORIES, 
  PRODUCT_UNITS 
} from '../../../shared/constants';
import { 
  productSchema, 
  type ProductFormInputs,
  prepareProductFormData 
} from '../utils/productValidation';
import { useProducts } from '../hooks/useProducts';
import { useGeolocation } from '../../../shared/hooks';
import ProductImageUploader from './ProductImageUploader';
import LocationSelector from '../../../modules/users/components/LocationSelector';

interface ProductFormProps {
  productId?: string;
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
  className?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
  productId,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const { selectedProduct, fetchProduct, createProduct, updateProduct, isLoading, error, clearError } = useProducts();
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const { location } = useGeolocation();
  
  const isEditMode = !!productId;
  
  // Set up react-hook-form
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<ProductFormInputs>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      unit: 'kg',
      category: 'warzywa',
      harvestDate: new Date()
    }
  });
  
  // Get selected category to show applicable subcategories
  const selectedCategory = watch('category');
  const subcategories = PRODUCT_SUBCATEGORIES[selectedCategory] || [];
  
  // Load product data if in edit mode
  useEffect(() => {
    if (isEditMode && productId) {
      fetchProduct(productId);
    }
  }, [isEditMode, productId, fetchProduct]);
  
  // Populate form with product data when loaded
  useEffect(() => {
    if (selectedProduct && isEditMode) {
      // Reset form with selected product data
      reset({
        name: selectedProduct.name,
        description: selectedProduct.description,
        price: selectedProduct.price,
        quantity: selectedProduct.quantity,
        unit: selectedProduct.unit,
        category: selectedProduct.category,
        subcategory: selectedProduct.subcategory,
        harvestDate: selectedProduct.harvestDate ? new Date(selectedProduct.harvestDate) : undefined,
        location: selectedProduct.location ? {
          coordinates: selectedProduct.location.coordinates,
          address: selectedProduct.location.address
        } : undefined
      });
    } else if (!isEditMode && location) {
      // For new products, set default location from user's location
      setValue('location', {
        coordinates: [location.longitude, location.latitude],
        address: ''
      });
    }
  }, [selectedProduct, isEditMode, reset, location, setValue]);
  
  // Handle image upload
  const handleImagesChange = (files: File[]) => {
    setProductImages(files);
    setImageUploadError(null);
  };
  
  // Handle location selection
  const handleLocationSelected = (coordinates: [number, number], address: string) => {
    setValue('location', { coordinates, address }, { shouldValidate: true });
  };
  
  // Handle form submission
  const onSubmit = async (data: ProductFormInputs) => {
    clearError();
    setImageUploadError(null);
    
    // Validate images
    if (!isEditMode && productImages.length === 0) {
      setImageUploadError('Dodaj co najmniej jedno zdjęcie produktu');
      return;
    }
    
    // Prepare form data for submission
    const formData = prepareProductFormData(data, productImages);
    
    try {
      let result;
      
      if (isEditMode && productId) {
        // Update existing product
        result = await updateProduct(productId, formData);
      } else {
        // Create new product
        result = await createProduct(formData);
      }
      
      if (result && onSuccess) {
        onSuccess(result._id);
      }
    } catch (err) {
      console.error('Error submitting product form:', err);
    }
  };
  
  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className={`bg-white rounded-lg shadow-md p-6 ${className}`}
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditMode ? 'Edytuj produkt' : 'Dodaj nowy produkt'}
      </h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div>
          {/* Basic info */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Informacje podstawowe
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa produktu *
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className={classNames(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
                    errors.name ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Nazwa produktu"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Opis produktu *
                </label>
                <textarea
                  id="description"
                  rows={5}
                  {...register('description')}
                  className={classNames(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
                    errors.description ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Opis produktu"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Cena (PLN) *
                  </label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price', { valueAsNumber: true })}
                    className={classNames(
                      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
                      errors.price ? "border-red-300" : "border-gray-300"
                    )}
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Ilość *
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="0"
                    step="1"
                    {...register('quantity', { valueAsNumber: true })}
                    className={classNames(
                      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
                      errors.quantity ? "border-red-300" : "border-gray-300"
                    )}
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                  Jednostka *
                </label>
                <select
                  id="unit"
                  {...register('unit')}
                  className={classNames(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
                    errors.unit ? "border-red-300" : "border-gray-300"
                  )}
                >
                  {PRODUCT_UNITS.map(unit => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                {errors.unit && (
                  <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Category */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Kategoria
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Kategoria produktu *
                </label>
                <select
                  id="category"
                  {...register('category')}
                  className={classNames(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
                    errors.category ? "border-red-300" : "border-gray-300"
                  )}
                >
                  {PRODUCT_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>
              
              {subcategories.length > 0 && (
                <div>
                  <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Podkategoria
                  </label>
                  <select
                    id="subcategory"
                    {...register('subcategory')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Wybierz podkategorię</option>
                    {subcategories.map(subcategory => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label htmlFor="harvestDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Data zbioru
                </label>
                <Controller
                  name="harvestDate"
                  control={control}
                  render={({ field }) => (
                    <input
                      id="harvestDate"
                      type="date"
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        field.onChange(date);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column */}
        <div>
          {/* Images */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Zdjęcia produktu
            </h3>
            
            <ProductImageUploader
              images={productImages}
              onChange={handleImagesChange}
              existingImages={selectedProduct?.images}
            />
            
            {imageUploadError && (
              <p className="mt-2 text-sm text-red-600">{imageUploadError}</p>
            )}
          </div>
          
          {/* Location */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Lokalizacja
            </h3>
            
            <LocationSelector
              initialCoordinates={watch('location')?.coordinates}
              initialAddress={watch('location')?.address}
              onLocationSelected={handleLocationSelected}
              error={
                errors.location?.coordinates?.message || 
                errors.location?.address?.message
              }
            />
          </div>
        </div>
      </div>
      
      {/* Form actions */}
      <div className="mt-8 flex justify-end space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Anuluj
          </button>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className={classNames(
            "px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            isLoading && "opacity-70 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isEditMode ? 'Zapisywanie...' : 'Dodawanie...'}
            </span>
          ) : (
            <span>{isEditMode ? 'Zapisz zmiany' : 'Dodaj produkt'}</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;