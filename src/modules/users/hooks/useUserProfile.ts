// src/modules/users/hooks/useUserProfile.ts
import { useEffect } from 'react';
import { useUserProfileStore } from '../store/userProfileStore';

/**
 * Hook do zarządzania profilem użytkownika
 */
export const useUserProfile = () => {
  const {
    profile,
    isLoading,
    error,
    fetchProfile,
    fetchUserProfile,
    updateProfile,
    uploadAvatar,
    clearError
  } = useUserProfileStore();

  // Automatyczne pobranie profilu użytkownika przy pierwszym renderowaniu
  useEffect(() => {
    if (!profile && !isLoading) {
      fetchProfile();
    }
  }, [profile, isLoading, fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    fetchUserProfile,
    updateProfile,
    uploadAvatar,
    clearError
  };
};

export default useUserProfile;