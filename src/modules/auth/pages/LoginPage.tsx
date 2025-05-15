// src/modules/auth/pages/LoginPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the return path from location state
  const from = location.state?.from || '/';
  
  // If already authenticated, redirect to home or intended page
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  const handleLoginSuccess = () => {
    navigate(from, { replace: true });
  };
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
};

export default LoginPage;