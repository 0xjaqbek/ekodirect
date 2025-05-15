// src/modules/auth/pages/VerifyEmailPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Weryfikacja Twojego adresu email...');
  
  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Brak tokenu weryfikacyjnego. Sprawdź link z emaila.');
        return;
      }
      
      try {
        const response = await authService.verifyEmail(token);
        
        if (response.success && response.data?.verified) {
          setStatus('success');
          setMessage('Twój adres email został zweryfikowany. Możesz się teraz zalogować.');
          
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.error || 'Nie udało się zweryfikować adresu email. Token może być nieważny lub wygasły.');
        }
      } catch {
        setStatus('error');
        setMessage('Wystąpił błąd podczas weryfikacji adresu email. Spróbuj ponownie później.');
      }
    };
    
    verifyEmail();
  }, [searchParams, navigate]);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-primary mb-4">
          Weryfikacja Adresu Email
        </h1>
        
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-700 text-center">{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <svg
                className="h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-700 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Przekierowanie do strony logowania...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <svg
                className="h-16 w-16 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-700 mb-4">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Przejdź do logowania
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;