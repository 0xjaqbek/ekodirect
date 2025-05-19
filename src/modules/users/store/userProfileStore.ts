// src/modules/users/store/userProfileStore.ts - dodaj debug logi
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../../../shared/api';
import { API_ROUTES } from '../../../shared/constants';
import type { User } from '../../../shared/types';
import { type FirebaseUserData, type FirebaseTimestamp } from '../../../shared/types/firebase';

// Function to normalize user data from Firebase/Firestore
const normalizeUserData = (userData: FirebaseUserData | null): User | null => {
  // Handle null userData
  if (!userData) return null;

  // Dodaj debug logi
  console.log('normalizeUserData - input:', userData);
  console.log('normalizeUserData - role from input:', userData.role);

  // Prepare normalized user data
  const normalizedUser: User = {
    // Ensure _id is defined (using id from Firebase or _id if it exists)
    _id: userData._id || userData.id || '',
    email: userData.email || '',
    passwordHash: userData.passwordHash || '',
    fullName: userData.fullName || '',
    role: userData.role || 'consumer', // UWAGA: Może być problem tutaj
    phoneNumber: userData.phoneNumber || '',
    // Ensure location has proper format
    location: {
      type: 'Point',
      coordinates: userData.location?.coordinates || [0, 0],
      address: userData.location?.address || ''
    },
    // Set default values for optional arrays
    certificates: userData.certificates || [],
    createdProducts: userData.createdProducts || [],
    orders: userData.orders || [],
    reviews: userData.reviews || [],
    localGroups: userData.localGroups || [],
    // Set default values for other fields
    bio: userData.bio,
    profileImage: userData.profileImage,
    isVerified: userData.isVerified !== undefined ? userData.isVerified : false,
    // Handle date conversion from Firebase Timestamp objects
    createdAt: convertFirebaseTimestampToDate(userData.createdAt) || new Date(),
    updatedAt: convertFirebaseTimestampToDate(userData.updatedAt) || new Date()
  };

  // Dodaj debug logi
  console.log('normalizeUserData - output:', normalizedUser);
  console.log('normalizeUserData - role in output:', normalizedUser.role);

  return normalizedUser;
};

// Helper function to convert Firebase Timestamp to JavaScript Date
const convertFirebaseTimestampToDate = (
  timestamp: FirebaseTimestamp | Date | string | unknown
): Date | null => {
  if (!timestamp) return null;

  try {
    // If it's a Firebase Timestamp with toDate method
    if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
      return (timestamp as FirebaseTimestamp).toDate();
    }
    
    // If it's already a Date
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    // If it's a string or number, convert to Date
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Return current date as fallback
    return new Date();
  } catch (error) {
    console.error('Error converting timestamp:', error);
    return new Date();
  }
};

// Interface for user profile state
export interface UserProfileState {
  profile: User | null;
  isLoading: boolean;
  error: string | null;

  // Profile management methods
  fetchProfile: () => Promise<boolean>;
  fetchUserProfile: (userId: string) => Promise<User | null>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<boolean>;
  clearError: () => void;
}

// Create store with Zustand
export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set) => ({
      // Initial state
      profile: null,
      isLoading: false,
      error: null,

      // Fetch current user profile
      fetchProfile: async () => {
        set({ isLoading: true, error: null });

        try {
          console.log('fetchProfile - Making API call to:', API_ROUTES.USERS.ME);
          const response = await apiClient.get<FirebaseUserData>(API_ROUTES.USERS.ME);

          console.log('fetchProfile - API response:', response);

          if (response.success && response.data) {
            console.log('fetchProfile - Raw data from API:', response.data);
            
            // Normalize user data
            const normalizedUser = normalizeUserData(response.data);
            
            console.log('fetchProfile - Normalized user:', normalizedUser);
            
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
          console.error('fetchProfile - Error:', error);
          set({
            error: error instanceof Error ? error.message : 'Błąd podczas pobierania profilu',
            isLoading: false
          });
          return false;
        }
      },

      // Fetch another user's profile by ID
      fetchUserProfile: async (userId: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.get<FirebaseUserData>(API_ROUTES.USERS.BY_ID(userId));

          if (response.success && response.data) {
            set({ isLoading: false });
            // Normalize user data
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

      // Update user profile
      updateProfile: async (userData: Partial<User>) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.put<FirebaseUserData>(API_ROUTES.USERS.ME, userData);

          if (response.success && response.data) {
            // Normalize user data
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

      // Upload avatar
      uploadAvatar: async (file: File) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.uploadFile<FirebaseUserData>(
            API_ROUTES.USERS.AVATAR, 
            file, 
            'avatar'
          );

          if (response.success && response.data) {
            // Normalize user data
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

      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'user-profile-storage',
      // Only persist the profile in storage
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);

export default useUserProfileStore;