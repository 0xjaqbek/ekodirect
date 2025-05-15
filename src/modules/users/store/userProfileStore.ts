// Zaktualizowany userProfileStore.ts z obsługą Firestore Timestamp

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../../../shared/api';
import { API_ROUTES, STORAGE_KEYS } from '../../../shared/constants';
import type { User } from '../../../shared/types';
import { type FirebaseUserData } from '../../../shared/types/firebase';

// Funkcja do normalizacji danych użytkownika z Firebase/Firestore
const normalizeUserData = (userData: FirebaseUserData | null): User => {
  // Obsługa przypadku, gdy userData jest null lub undefined
  if (!userData) return null;

  // Przygotuj znormalizowane dane użytkownika
  return {
    ...userData,
    // Upewnij się, że _id jest zdefiniowane (używając id z Firebase lub _id, jeśli istnieje)
    _id: userData._id || userData.id || '',
    // Upewnij się, że lokalizacja ma właściwy format
    location: userData.location || {
      type: 'Point',
      coordinates: [0, 0],
      address: ''
    },
    // Puste tablice jako domyślne wartości, jeśli nie istnieją
    certificates: userData.certificates || [],
    createdProducts: userData.createdProducts || [],
    orders: userData.orders || [],
    reviews: userData.reviews || [],
    localGroups: userData.localGroups || [],
    // Domyślne wartości dla pozostałych pól
    isVerified: userData.isVerified !== undefined ? userData.isVerified : false,
    createdAt: userData.createdAt ? (
      // Jeśli createdAt to obiekt Firestore Timestamp, konwertuj go
      typeof userData.createdAt === 'object' && 'toDate' in userData.createdAt 
        ? userData.createdAt.toDate() 
        : new Date(userData.createdAt)
    ) : new Date(),
    updatedAt: userData.updatedAt ? (
      // Jeśli updatedAt to obiekt Firestore Timestamp, konwertuj go
      typeof userData.updatedAt === 'object' && 'toDate' in userData.updatedAt 
        ? userData.updatedAt.toDate() 
        : new Date(userData.updatedAt)
    ) : new Date()
  } as User;
};

// Interfejs stanu profilu użytkownika
export interface UserProfileState {
  profile: User | null;
  isLoading: boolean;
  error: string | null;

  // Metody zarządzania profilem
  fetchProfile: () => Promise<boolean>;
  fetchUserProfile: (userId: string) => Promise<User | null>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<boolean>;
  clearError: () => void;
}

// Utworzenie store z Zustand
export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set, get) => ({
      // Stan początkowy
      profile: null,
      isLoading: false,
      error: null,

      // Pobranie profilu zalogowanego użytkownika
      fetchProfile: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.get<FirebaseUserData>(API_ROUTES.USERS.ME);

          if (response.success && response.data) {
            // Normalizuj dane użytkownika
            const normalizedUser = normalizeUserData(response.data);
            
            set({
              profile: normalizedUser,
              isLoading: false
            });
            return true;
          } else {
            set({
              error: response.error || 'Nie udało się pobrać profilu',
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Błąd podczas pobierania profilu',
            isLoading: false
          });
          return false;
        }
      },

      // Pobranie profilu innego użytkownika po ID
      fetchUserProfile: async (userId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.get<FirebaseUserData>(API_ROUTES.USERS.BY_ID(userId));

          if (response.success && response.data) {
            set({ isLoading: false });
            // Normalizuj dane użytkownika
            return normalizeUserData(response.data);
          } else {
            set({
              error: response.error || 'Nie udało się pobrać profilu użytkownika',
              isLoading: false
            });
            return null;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Błąd podczas pobierania profilu użytkownika',
            isLoading: false
          });
          return null;
        }
      },

      // Aktualizacja profilu użytkownika
      updateProfile: async (userData: Partial<User>) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.put<FirebaseUserData>(API_ROUTES.USERS.ME, userData);

          if (response.success && response.data) {
            // Normalizuj dane użytkownika
            const normalizedUser = normalizeUserData(response.data);
            
            set({
              profile: normalizedUser,
              isLoading: false
            });
            return true;
          } else {
            set({
              error: response.error || 'Nie udało się zaktualizować profilu',
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Błąd podczas aktualizacji profilu',
            isLoading: false
          });
          return false;
        }
      },

      // Upload zdjęcia profilowego
      uploadAvatar: async (file: File) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.uploadFile<FirebaseUserData>(
            API_ROUTES.USERS.AVATAR, 
            file, 
            'avatar'
          );

          if (response.success && response.data) {
            // Normalizuj dane użytkownika
            const normalizedUser = normalizeUserData(response.data);
            
            set({
              profile: normalizedUser,
              isLoading: false
            });
            return true;
          } else {
            set({
              error: response.error || 'Nie udało się przesłać zdjęcia profilowego',
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Błąd podczas przesyłania zdjęcia profilowego',
            isLoading: false
          });
          return false;
        }
      },

      // Czyszczenie błędu
      clearError: () => set({ error: null })
    }),
    {
      name: 'user-profile-storage',
      // Przechowuj tylko profil w trwałym storage
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);

export default useUserProfileStore;