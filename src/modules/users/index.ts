// src/modules/users/index.ts
// Eksport komponentów
export { default as UserProfile } from './components/UserProfile';
export { default as UserProfileForm } from './components/UserProfileForm';
export { default as PublicProfile } from './components/PublicProfile';
export { default as UserAvatar } from './components/UserAvatar';
export { default as FarmerCard } from './components/FarmerCard';
export { default as LocationSelector } from './components/LocationSelector';

// Eksport stron
export { default as ProfilePage } from './pages/ProfilePage';
export { default as EditProfilePage } from './pages/EditProfilePage';
export { default as FarmerProfilePage } from './pages/FarmerProfilePage';

// Eksport hooków
export { default as useUserProfile } from './hooks/useUserProfile';

// Eksport store
export { useUserProfileStore } from './store/userProfileStore';
export type { UserProfileState } from './store/userProfileStore';

// Eksport serwisów
export { default as userService } from './services/userService';

// Eksport narzędzi
export * from './utils/userValidation';