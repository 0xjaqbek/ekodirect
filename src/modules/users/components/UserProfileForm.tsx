// src/modules/users/components/UserProfileForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userProfileSchema, type UserProfileFormInputs } from '../utils/userValidation';
import { useUserProfile } from '../hooks/useUserProfile';
import UserAvatar from './UserAvatar';
import LocationSelector from './LocationSelector';
import classNames from 'classnames';

const UserProfileForm: React.FC = () => {
  const { profile, isLoading, error, updateProfile, uploadAvatar, clearError } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<UserProfileFormInputs>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      fullName: profile?.fullName || '',
      phoneNumber: profile?.phoneNumber || '',
      bio: profile?.bio || '',
      location: {
        coordinates: profile?.location?.coordinates || [0, 0],
        address: profile?.location?.address || ''
      }
    }
  });

  // Przygotuj inicjały z imienia i nazwiska
  const initials = profile?.fullName
    ? profile.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '';

  // Obsługa uploadu zdjęcia
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Sprawdź typ pliku
    if (!file.type.startsWith('image/')) {
      setUploadError('Plik musi być obrazem');
      return;
    }

    // Sprawdź rozmiar pliku (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Plik nie może być większy niż 5MB');
      return;
    }

    setAvatarFile(file);
    setUploadError(null);

    // Utwórz podgląd
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Obsługa lokalizacji
  const handleLocationSelected = (coordinates: [number, number], address: string) => {
    setValue('location.coordinates', coordinates);
    setValue('location.address', address);
  };

  // Obsługa wysłania formularza
  const onSubmit = async (data: UserProfileFormInputs) => {
    clearError();
    setIsSubmitting(true);
    setUpdateSuccess(false);

    try {
      // Najpierw prześlij avatar, jeśli został wybrany
      if (avatarFile) {
        const avatarSuccess = await uploadAvatar(avatarFile);
        if (!avatarSuccess) {
          setUploadError('Nie udało się przesłać zdjęcia profilowego');
          setIsSubmitting(false);
          return;
        }
      }

      // Następnie zaktualizuj profil
      const success = await updateProfile({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        bio: data.bio,
        location: data.location
      });

      if (success) {
        setUpdateSuccess(true);
        // Resetuj stan avatara
        setAvatarFile(null);
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error('Błąd podczas aktualizacji profilu', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edytuj profil</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {updateSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Profil został zaktualizowany pomyślnie!
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zdjęcie profilowe
        </label>
        <div className="flex items-center space-x-6">
          <UserAvatar
            src={avatarPreview || profile.profileImage}
            initials={initials}
            size="xl"
            alt={profile.fullName}
          />
          <div className="flex-1">
            <label className="block">
              <span className="sr-only">Wybierz zdjęcie profilowe</span>
              <input
                type="file"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-white
                  hover:file:bg-primary-dark
                  cursor-pointer"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG lub GIF. Maksymalnie 5MB.
            </p>
            {uploadError && (
              <p className="mt-1 text-xs text-red-600">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Imię i nazwisko
        </label>
        <input
          id="fullName"
          type="text"
          {...register('fullName')}
          className={classNames(
            "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
            errors.fullName ? "border-red-300" : "border-gray-300"
          )}
          placeholder="Twoje imię i nazwisko"
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
          Numer telefonu
        </label>
        <input
          id="phoneNumber"
          type="tel"
          {...register('phoneNumber')}
          className={classNames(
            "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
            errors.phoneNumber ? "border-red-300" : "border-gray-300"
          )}
          placeholder="Twój numer telefonu"
        />
        {errors.phoneNumber && (
          <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
          O mnie
        </label>
        <textarea
          id="bio"
          {...register('bio')}
          rows={4}
          className={classNames(
            "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
            errors.bio ? "border-red-300" : "border-gray-300"
          )}
          placeholder="Napisz kilka słów o sobie..."
        />
        {errors.bio && (
          <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Maksymalnie 500 znaków
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lokalizacja
        </label>
        <LocationSelector
          initialCoordinates={watch('location.coordinates')}
          initialAddress={watch('location.address')}
          onLocationSelected={handleLocationSelected}
          error={errors.location?.address?.message || errors.location?.coordinates?.message}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={classNames(
            "inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            isSubmitting && "opacity-70 cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Zapisywanie...
            </>
          ) : (
            'Zapisz zmiany'
          )}
        </button>
      </div>
    </form>
  );
};

export default UserProfileForm;
