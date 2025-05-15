// src/modules/users/tests/integration.test.ts
import { act, renderHook } from '@testing-library/react-hooks';
import { useUserProfile } from '../hooks/useUserProfile';
import userService from '../services/userService';

// Mock userService
jest.mock('../services/userService');

describe('UserProfile Integration', () => {
  // Test pobierania profilu
  test('should fetch user profile', async () => {
    // Ustaw mocka dla userService
    userService.getCurrentUserProfile.mockResolvedValue({
      success: true,
      data: {
        _id: '123',
        fullName: 'Jan Kowalski',
        email: 'jan@example.com',
        role: 'farmer'
      }
    });
    
    // Renderuj hook
    const { result, waitForNextUpdate } = renderHook(() => useUserProfile());
    
    // Wywołaj fetchProfile
    act(() => {
      result.current.fetchProfile();
    });
    
    // Poczekaj na zakończenie asynchronicznej operacji
    await waitForNextUpdate();
    
    // Sprawdź czy profil został załadowany
    expect(result.current.profile).toBeDefined();
    expect(result.current.profile._id).toBe('123');
    expect(result.current.profile.fullName).toBe('Jan Kowalski');
  });
  
  // Test aktualizacji profilu
  test('should update user profile', async () => {
    // Ustaw mocka dla userService
    userService.updateUserProfile.mockResolvedValue({
      success: true,
      data: {
        _id: '123',
        fullName: 'Jan Nowak', // Zmienione nazwisko
        email: 'jan@example.com',
        role: 'farmer'
      }
    });
    
    // Renderuj hook
    const { result, waitForNextUpdate } = renderHook(() => useUserProfile());
    
    // Ustaw początkowy stan
    act(() => {
      result.current.profile = {
        _id: '123',
        fullName: 'Jan Kowalski',
        email: 'jan@example.com',
        role: 'farmer'
      };
    });
    
    // Wywołaj updateProfile
    act(() => {
      result.current.updateProfile({ fullName: 'Jan Nowak' });
    });
    
    // Poczekaj na zakończenie asynchronicznej operacji
    await waitForNextUpdate();
    
    // Sprawdź czy profil został zaktualizowany
    expect(result.current.profile).toBeDefined();
    expect(result.current.profile.fullName).toBe('Jan Nowak');
  });
});