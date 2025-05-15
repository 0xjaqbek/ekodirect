// src/modules/users/tests/users.test.ts
import { validateUserProfile, formatUserData } from '../utils/userValidation';

// Przykłady testów jednostkowych
describe('UserValidation', () => {
  // Test walidacji formularza profilu
  describe('validateUserProfile', () => {
    test('should validate correct profile data', () => {
      const validData = {
        fullName: 'Jan Kowalski',
        phoneNumber: '123456789',
        bio: 'Przykładowa biografia',
        location: {
          coordinates: [21.0118, 52.2298],
          address: 'Warszawa, Polska'
        }
      };
      
      const result = validateUserProfile(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
    
    test('should return errors for invalid profile data', () => {
      const invalidData = {
        fullName: 'J',
        phoneNumber: 'invalid',
        bio: 'OK',
        location: {
          coordinates: [0, 0],
          address: ''
        }
      };
      
      const result = validateUserProfile(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveProperty('fullName');
      expect(result.errors).toHaveProperty('phoneNumber');
      expect(result.errors).toHaveProperty('location.address');
    });
  });
  
  // Test formatowania danych użytkownika
  describe('formatUserData', () => {
    test('should format user data correctly', () => {
      const user = {
        _id: '123',
        email: 'jan@example.com',
        passwordHash: 'hash',
        fullName: 'Jan Kowalski',
        role: 'farmer',
        phoneNumber: '123456789',
        location: {
          type: 'Point',
          coordinates: [21.0118, 52.2298],
          address: 'Warszawa, Polska'
        },
        isVerified: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date()
      };
      
      const formattedUser = formatUserData(user);
      expect(formattedUser).toHaveProperty('formattedJoinDate');
      expect(formattedUser).toHaveProperty('initials');
      expect(formattedUser.initials).toBe('JK');
    });
  });
});