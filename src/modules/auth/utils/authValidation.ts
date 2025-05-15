// src/modules/auth/utils/authValidation.ts
import { z } from 'zod';
import { VALIDATION } from '../../../shared/constants';
import { isValidEmail, isValidPhoneNumber } from '../../../shared/utils';

// Validation schema for login form
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format adresu email'),
  password: z
    .string()
    .min(1, 'Hasło jest wymagane'),
  rememberMe: z.boolean().optional()
});

// Type for login form
export type LoginFormInputs = z.infer<typeof loginSchema>;

// Validation schema for registration form
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format adresu email')
    .refine((val) => isValidEmail(val), { message: 'Nieprawidłowy format adresu email' }),
  password: z
    .string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH, `Hasło musi mieć co najmniej ${VALIDATION.PASSWORD_MIN_LENGTH} znaków`)
    .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
    .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Hasło musi zawierać przynajmniej jeden znak specjalny'),
  confirmPassword: z.string().min(1, 'Potwierdzenie hasła jest wymagane'),
  fullName: z.string().min(3, 'Imię i nazwisko musi mieć co najmniej 3 znaki'),
  role: z.enum(['farmer', 'consumer'], {
    required_error: 'Wybierz rolę'
  }),
  phoneNumber: z
    .string()
    .min(1, 'Numer telefonu jest wymagany')
    .refine((val) => isValidPhoneNumber(val), { message: 'Nieprawidłowy format numeru telefonu' }),
  location: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
    address: z.string().min(1, 'Adres jest wymagany')
  }),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'Musisz zaakceptować regulamin' })
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą być takie same',
  path: ['confirmPassword']
});

// Type for registration form
export type RegisterFormInputs = z.infer<typeof registerSchema>;

// Validation schema for password reset request
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .min(1, 'Email jest wymagany')
    .email('Nieprawidłowy format adresu email')
});

// Type for password reset request form
export type RequestPasswordResetInputs = z.infer<typeof requestPasswordResetSchema>;

// Validation schema for password reset
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH, `Hasło musi mieć co najmniej ${VALIDATION.PASSWORD_MIN_LENGTH} znaków`)
    .regex(/[A-Z]/, 'Hasło musi zawierać przynajmniej jedną wielką literę')
    .regex(/[0-9]/, 'Hasło musi zawierać przynajmniej jedną cyfrę')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Hasło musi zawierać przynajmniej jeden znak specjalny'),
  confirmPassword: z.string().min(1, 'Potwierdzenie hasła jest wymagane')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła muszą być takie same',
  path: ['confirmPassword']
});

// Type for password reset form
export type ResetPasswordInputs = z.infer<typeof resetPasswordSchema>;