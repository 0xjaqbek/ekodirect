// src/modules/auth/components/LoginForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { loginSchema, type LoginFormInputs } from '../utils/authValidation';
import { useAuth } from '../hooks/useAuth';
import classNames from 'classnames';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, error, clearError, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginFormInputs) => {
    clearError();
    const success = await login({
      email: data.email,
      password: data.password
    });

    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="w-full max-w-md">
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="bg-white rounded-lg shadow-md p-6"
        noValidate
      >
        <h2 className="text-2xl font-bold text-primary mb-6 text-center">Logowanie</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

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
              placeholder="Twoje hasło"
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

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              {...register('rememberMe')}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
              Zapamiętaj mnie
            </label>
          </div>
          <div className="text-sm">
            <Link to="/forgot-password" className="text-primary hover:text-primary-dark">
              Zapomniałeś hasła?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={classNames(
            "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            isLoading && "opacity-70 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <span>Logowanie...</span>
          ) : (
            <span>Zaloguj się</span>
          )}
        </button>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Nie masz jeszcze konta?{' '}
            <Link to="/register" className="text-primary hover:text-primary-dark font-medium">
              Zarejestruj się
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;