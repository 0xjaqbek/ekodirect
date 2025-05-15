// src/modules/users/utils/userValidation.ts
import { z } from 'zod';
import { isValidPhoneNumber } from '../../../shared/utils';

// Schemat walidacji dla formularza profilu
export const userProfileSchema = z.object({
  fullName: z.string().min(3, 'Imię i nazwisko musi mieć co najmniej 3 znaki'),
  phoneNumber: z
    .string()
    .min(1, 'Numer telefonu jest wymagany')
    .refine((val) => isValidPhoneNumber(val), { message: 'Nieprawidłowy format numeru telefonu' }),
  bio: z
    .string()
    .max(500, 'Biografia nie może przekraczać 500 znaków')
    .optional(),
  location: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
    address: z.string().min(1, 'Adres jest wymagany')
  }),
});

// Typ dla formularza profilu
export type UserProfileFormInputs = z.infer<typeof userProfileSchema>;

// Schemat walidacji dla certyfikatów (dla rolników)
export const certificateSchema = z.object({
  name: z.string().min(1, 'Nazwa certyfikatu jest wymagana'),
  type: z.enum(['organic', 'eco', 'fair-trade', 'other'], {
    required_error: 'Wybierz typ certyfikatu'
  }),
  issuingAuthority: z.string().min(1, 'Nazwa organu wydającego jest wymagana'),
  validUntil: z.date({
    required_error: 'Data ważności jest wymagana'
  }),
});

// Typ dla formularza certyfikatu
export type CertificateFormInputs = z.infer<typeof certificateSchema>;

// Funkcja walidacji danych profilu
export const validateUserProfile = (data: UserProfileFormInputs): { 
  isValid: boolean;
  errors?: Record<string, string>;
} => {
  try {
    userProfileSchema.parse(data);
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

// Formatuj dane użytkownika do wyświetlenia
export const formatUserData = (user: User) => {
  return {
    ...user,
    // Dodajemy dodatkowe pola i formatowanie
    formattedJoinDate: new Date(user.createdAt).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    initials: user.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2),
    // Inne przydatne transformacje
  };
};