// src/modules/auth/pages/RegisterPage.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import type { RegisterFormInputs } from '../utils/authValidation';
import { useForm } from 'react-hook-form';

const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const { watch } = useForm<RegisterFormInputs>({
    defaultValues: { email: '' } // Provide a default value for email
  });
  const email = watch('email');
  
  const handleRegisterSuccess = () => {
    navigate('/verify-email-info', { 
      replace: true,
      state: { email: email }
    });
  };
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-xl">
        <RegisterForm onSuccess={handleRegisterSuccess} />
      </div>
    </div>
  );
};

export default RegisterPage;