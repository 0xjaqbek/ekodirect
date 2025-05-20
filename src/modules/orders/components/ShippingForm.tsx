// src/modules/orders/components/ShippingForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import { shippingSchema, type ShippingFormInputs } from '../utils/orderValidation';

interface ShippingFormProps {
  onSubmit: (data: ShippingFormInputs) => void;
  defaultValues?: Partial<ShippingFormInputs>;
  isLoading?: boolean;
}

const ShippingForm: React.FC<ShippingFormProps> = ({
  onSubmit,
  defaultValues,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ShippingFormInputs>({
    resolver: zodResolver(shippingSchema),
    defaultValues: defaultValues || {
      street: '',
      city: '',
      postalCode: '',
      country: 'Polska',
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Default delivery date: 3 days from now
    }
  });
  
  // Calculate min and max delivery dates (between 1 and 14 days from now)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);
  
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="street" className="block text-sm font-medium text-gray-700">
          Ulica i numer
        </label>
        <input
          id="street"
          type="text"
          {...register('street')}
          className={classNames(
            "mt-1 block w-full rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm",
            errors.street ? "border-red-300" : "border-gray-300"
          )}
          placeholder="Wpisz ulicę i numer domu/mieszkania"
          disabled={isLoading}
        />
        {errors.street && (
          <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            Miejscowość
          </label>
          <input
            id="city"
            type="text"
            {...register('city')}
            className={classNames(
              "mt-1 block w-full rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm",
              errors.city ? "border-red-300" : "border-gray-300"
            )}
            placeholder="Wpisz nazwę miejscowości"
            disabled={isLoading}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
            Kod pocztowy
          </label>
          <input
            id="postalCode"
            type="text"
            {...register('postalCode')}
            className={classNames(
              "mt-1 block w-full rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm",
              errors.postalCode ? "border-red-300" : "border-gray-300"
            )}
            placeholder="XX-XXX"
            disabled={isLoading}
          />
          {errors.postalCode && (
            <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
          Kraj
        </label>
        <input
          id="country"
          type="text"
          {...register('country')}
          className={classNames(
            "mt-1 block w-full rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm",
            errors.country ? "border-red-300" : "border-gray-300"
          )}
          disabled={true} // Currently only shipping to Poland
        />
        {errors.country && (
          <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700">
          Preferowana data dostawy
        </label>
        <input
          id="deliveryDate"
          type="date"
          {...register('deliveryDate')}
          className={classNames(
            "mt-1 block w-full rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm",
            errors.deliveryDate ? "border-red-300" : "border-gray-300"
          )}
          min={formatDateForInput(minDate)}
          max={formatDateForInput(maxDate)}
          disabled={isLoading}
        />
        {errors.deliveryDate && (
          <p className="mt-1 text-sm text-red-600">{errors.deliveryDate.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Dostawa jest możliwa w ciągu 1-14 dni od złożenia zamówienia.
        </p>
      </div>
      
      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className={classNames(
            "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            isLoading && "opacity-70 cursor-not-allowed"
          )}
        >
          {isLoading ? "Przetwarzanie..." : "Kontynuuj do płatności"}
        </button>
      </div>
    </form>
  );
};

export default ShippingForm;