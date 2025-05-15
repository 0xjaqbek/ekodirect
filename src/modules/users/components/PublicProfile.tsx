// src/modules/users/components/PublicProfile.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';
import UserProfile from './UserProfile';
import { calculateDistance } from '../../../shared/utils';
import { useGeolocation } from '../../../shared/hooks';
import type { User } from '../../../shared/types';

const PublicProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { fetchUserProfile, profile: currentUserProfile } = useUserProfile();
  const [farmer, setFarmer] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const { location } = useGeolocation();

  useEffect(() => {
    const loadFarmerProfile = async () => {
      if (!id) {
        setError('Nie znaleziono identyfikatora rolnika');
        setLoading(false);
        return;
      }

      try {
        const farmerData = await fetchUserProfile(id);
        
        if (farmerData) {
          setFarmer(farmerData);
          
          // Oblicz odległość jeśli mamy lokalizację użytkownika
          if (location && location.latitude && location.longitude) {
            const dist = calculateDistance(
              location.latitude,
              location.longitude,
              farmerData.location.coordinates[1],
              farmerData.location.coordinates[0]
            );
            setDistance(dist);
          }
        } else {
          setError('Nie udało się pobrać danych rolnika');
        }
      } catch (err) {
        setError('Wystąpił błąd podczas pobierania danych rolnika');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFarmerProfile();
  }, [id, fetchUserProfile, location]);

  // Sprawdź czy to profil zalogowanego użytkownika
  const isCurrentUser = currentUserProfile && farmer ? currentUserProfile._id === farmer._id : false;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !farmer) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h2 className="text-xl text-gray-700 mb-2">Wystąpił błąd</h2>
        <p className="text-gray-600 mb-4">{error || 'Nie znaleziono profilu użytkownika'}</p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Wróć do strony głównej
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserProfile user={farmer} isCurrentUser={isCurrentUser} />
      
      {farmer.role === 'farmer' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Produkty rolnika
          </h2>
          
          {/* Tu będzie lista produktów rolnika */}
          <div className="text-center py-8 text-gray-500">
            <p>Produkty rolnika zostaną wyświetlone tutaj.</p>
          </div>
          
          <div className="mt-4">
            <Link 
              to="/products" 
              className="inline-flex items-center px-4 py-2 border border-primary rounded-md text-sm font-medium text-primary hover:bg-primary-light/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Zobacz wszystkie produkty
            </Link>
          </div>
        </div>
      )}
      
      {farmer.role === 'farmer' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Opinie o rolniku
          </h2>
          
          {/* Tu będzie lista opinii o rolniku */}
          <div className="text-center py-8 text-gray-500">
            <p>Opinie o rolniku zostaną wyświetlone tutaj.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
