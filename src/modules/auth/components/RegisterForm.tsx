// src/modules/auth/components/RegisterForm.tsx
import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterFormInputs } from '../utils/authValidation';
import { useAuth } from '../hooks/useAuth';
import { useGeolocation } from '../../../shared/hooks';
import classNames from 'classnames';

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register: registerUser, error, clearError, isLoading } = useAuth();
  const navigate = useNavigate();
  const { location, getLocation } = useGeolocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [manualAddress, setManualAddress] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      role: 'consumer',
      phoneNumber: '',
      location: {
        coordinates: [0, 0],
        address: ''
      },
      // Fix the first error - don't set termsAccepted explicitly since default is undefined
      // This will let the Zod validation work properly
    }
  });

  // Watch the role field
  const selectedRole = watch('role');

  const handleLocationDetection = async () => {
    setLocationError(null);
    getLocation();
    
    if (location?.error) {
      setLocationError(location.error);
      return;
    }
    
    if (location && !location.error) {
      setValue('location.coordinates', [location.longitude, location.latitude]);
      
      try {
        // Get address from coordinates using Nominatim API (OpenStreetMap)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`
        );
        const data = await response.json();
        
        if (data && data.display_name) {
          setValue('location.address', data.display_name);
          setManualAddress(data.display_name);
        }
      } catch (error) {
        console.error('Error fetching address:', error);
        setLocationError('Nie udało się pobrać adresu. Wprowadź go ręcznie.');
      }
    }
  };

  const handleManualAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setManualAddress(address);
    setValue('location.address', address);
  };

  const goToNextStep = async () => {
    const isValid = await trigger(['email', 'password', 'confirmPassword', 'fullName', 'role', 'phoneNumber']);
    
    if (isValid) {
      setStep(2);
    }
  };

  const goToPreviousStep = () => {
    setStep(1);
  };

  // Fix the second error by providing explicit type for onSubmit
  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    clearError();
    
    // Make sure we have coordinates and address
    if (!data.location.coordinates[0] || !data.location.coordinates[1]) {
      setLocationError('Lokalizacja jest wymagana. Użyj detekcji lub wprowadź koordynaty ręcznie.');
      return;
    }
    
    if (!data.location.address) {
      setLocationError('Adres jest wymagany.');
      return;
    }
    
    const success = await registerUser({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      role: data.role,
      phoneNumber: data.phoneNumber,
      location: {
        coordinates: data.location.coordinates,
        address: data.location.address
      }
    });

    if (success) {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/verify-email-info');
      }
    }
  };

  return (
    <div className="w-full max-w-xl">
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="bg-white rounded-lg shadow-md p-6"
        noValidate
      >
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">Rejestracja</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={classNames(
                  "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
                  errors.email ? "border-red-300" : "border-gray-300"
                )}
                placeholder="Twój adres email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Hasło
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  className={classNames(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
                    errors.password ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Wybierz hasło"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Ukryj" : "Pokaż"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Potwierdź hasło
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register('confirmPassword')}
                  className={classNames(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
                    errors.confirmPassword ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Potwierdź hasło"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "Ukryj" : "Pokaż"}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rola
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label 
                  className={classNames(
                    "flex items-center justify-center p-4 border rounded-md cursor-pointer",
                    selectedRole === 'consumer' 
                      ? "border-primary-dark bg-primary/10 text-primary-dark" 
                      : "border-gray-300"
                  )}
                >
                  <input
                    type="radio"
                    value="consumer"
                    {...register('role')}
                    className="sr-only"
                  />
                  <span>Konsument</span>
                </label>
                
                <label 
                  className={classNames(
                    "flex items-center justify-center p-4 border rounded-md cursor-pointer",
                    selectedRole === 'farmer' 
                      ? "border-primary-dark bg-primary/10 text-primary-dark" 
                      : "border-gray-300"
                  )}
                >
                  <input
                    type="radio"
                    value="farmer"
                    {...register('role')}
                    className="sr-only"
                  />
                  <span>Rolnik</span>
                </label>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={goToNextStep}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Dalej
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokalizacja
              </label>
              <div className="mb-2">
                <button
                  type="button"
                  onClick={handleLocationDetection}
                  className="w-full py-2 px-4 border border-primary rounded-md text-primary hover:bg-primary-light/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Wykryj moją lokalizację
                </button>
              </div>

              {locationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {locationError}
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Adres
                </label>
                <input
                  id="address"
                  type="text"
                  value={manualAddress}
                  onChange={handleManualAddressChange}
                  className={classNames(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
                    errors.location?.address ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Twój adres"
                />
                {errors.location?.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.address.message}</p>
                )}
              </div>

              <div className="flex items-center mb-6">
                <input
                  id="termsAccepted"
                  type="checkbox"
                  {...register('termsAccepted')}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-700">
                  Akceptuję <Link to="/terms" className="text-primary">regulamin</Link> i{' '}
                  <Link to="/privacy" className="text-primary">politykę prywatności</Link>
                </label>
              </div>
              {errors.termsAccepted && (
                <p className="mt-1 text-sm text-red-600 mb-4">{errors.termsAccepted.message}</p>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="w-1/2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Wstecz
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={classNames(
                    "w-1/2 py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isLoading ? "Rejestracja..." : "Zarejestruj się"}
                </button>
              </div>
            </div>
          </>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Masz już konto?{' '}
            <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
              Zaloguj się
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;