// src/modules/orders/utils/orderValidation.ts
import { z } from 'zod';
import { isValidPostalCode } from '../../../shared/utils';

// Validation schema for shipping information
export const shippingSchema = z.object({
  street: z.string().min(1, 'Ulica jest wymagana'),
  city: z.string().min(1, 'Miejscowość jest wymagana'),
  postalCode: z
    .string()
    .min(1, 'Kod pocztowy jest wymagany')
    .refine(isValidPostalCode, { message: 'Nieprawidłowy format kodu pocztowego (XX-XXX)' }),
  country: z.string().min(1, 'Kraj jest wymagany'),
  deliveryDate: z
    .date()
    .refine(
      (date) => {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 1);
        return date >= minDate;
      },
      { message: 'Data dostawy musi być co najmniej jutro' }
    )
    .refine(
      (date) => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 14);
        return date <= maxDate;
      },
      { message: 'Data dostawy może być maksymalnie za 14 dni' }
    )
});

// Type for shipping form inputs
export type ShippingFormInputs = z.infer<typeof shippingSchema>;

// Validation schema for payment information
export const paymentSchema = z.object({
  paymentMethod: z.enum(['card', 'bank_transfer']),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional()
});

// Type for payment form inputs
export type PaymentFormInputs = z.infer<typeof paymentSchema>;

// Helper function to transform form data into order request
export const prepareOrderRequest = (
  cartItems: Array<{ productId: string; quantity: number }>,
  shippingData: ShippingFormInputs
) => {
  return {
    items: cartItems.map(item => ({
      product: item.productId,
      quantity: item.quantity
    })),
    shippingAddress: {
      street: shippingData.street,
      city: shippingData.city,
      postalCode: shippingData.postalCode,
      country: shippingData.country
    },
    deliveryDate: shippingData.deliveryDate
  };
};