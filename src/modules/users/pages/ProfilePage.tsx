// src/modules/users/pages/ProfilePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import UserProfile from '../components/UserProfile';

const ProfilePage: React.FC = () => {
  const { profile, isLoading, error } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-xl text-gray-700 mb-2">Wystąpił błąd</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Odśwież stronę
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-xl text-gray-700 mb-2">Brak danych profilu</h2>
        <p className="text-gray-600 mb-4">Nie udało się pobrać Twojego profilu. Spróbuj ponownie później.</p>
        <Link
          to="/login"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Zaloguj się ponownie
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Twój profil</h1>
        <p className="text-gray-600">Tutaj możesz zobaczyć i edytować swoje dane profilowe.</p>
      </div>

      <div className="space-y-6">
        <UserProfile user={profile} isCurrentUser={true} />
        
        {profile.role === 'farmer' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Twoje produkty
            </h2>
            
            {profile.createdProducts && profile.createdProducts.length > 0 ? (
              <div>
                {/* Tu będzie lista produktów rolnika */}
                <p>Twoje produkty zostaną wyświetlone tutaj.</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">Nie masz jeszcze żadnych produktów.</p>
                <Link 
                  to="/products/new" 
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Dodaj pierwszy produkt
                </Link>
              </div>
            )}
          </div>
        )}
        
        {profile.role === 'consumer' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Twoje ostatnie zamówienia
            </h2>
            
            {profile.orders && profile.orders.length > 0 ? (
              <div>
                {/* Tu będzie lista zamówień konsumenta */}
                <p>Twoje zamówienia zostaną wyświetlone tutaj.</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">Nie masz jeszcze żadnych zamówień.</p>
                <Link 
                  to="/products" 
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Przeglądaj produkty
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
