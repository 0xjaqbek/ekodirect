// src/modules/auth/pages/VerifyEmailInfoPage.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import authService from '../services/authService';

const VerifyEmailInfoPage: React.FC = () => {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const location = useLocation();
  
  // Extract email from location state or use empty string
  const email = location.state?.email || '';

  const handleResendVerification = async () => {
    if (!email) {
      setResendMessage({ 
        type: 'error', 
        text: 'Brak adresu email. Przejdź do strony logowania i spróbuj ponownie.' 
      });
      return;
    }

    setIsResending(true);
    setResendMessage(null);
    
    try {
      const response = await authService.resendVerificationEmail(email);
      
      if (response.success) {
        setResendMessage({ 
          type: 'success', 
          text: 'Link weryfikacyjny został wysłany ponownie. Sprawdź swoją skrzynkę email.' 
        });
      } else {
        setResendMessage({ 
          type: 'error', 
          text: response.error || 'Wystąpił błąd podczas wysyłania emaila. Spróbuj ponownie później.' 
        });
      }
    } catch  {
      setResendMessage({ 
        type: 'error', 
        text: 'Wystąpił błąd podczas wysyłania emaila. Spróbuj ponownie później.' 
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-primary mb-4">
          Sprawdź swoją skrzynkę email
        </h1>
        
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <svg
              className="h-16 w-16 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-700 mb-4">
            Wysłaliśmy link weryfikacyjny na adres{email ? ` ${email}` : ''}.
            Aby aktywować konto, kliknij w link zawarty w wiadomości.
          </p>
          <p className="text-gray-700 mb-6">
            Link jest ważny przez 24 godziny. Jeśli nie widzisz wiadomości, sprawdź folder Spam.
          </p>
          
          {resendMessage && (
            <div className={`p-3 mb-4 rounded ${
              resendMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {resendMessage.text}
            </div>
          )}
          
          <div className="flex flex-col space-y-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Przejdź do logowania
            </Link>
            <button
              onClick={handleResendVerification}
              disabled={isResending || !email}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? 'Wysyłanie...' : 'Wyślij link ponownie'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailInfoPage;