import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../../shared/utils';
import type { User } from '../../../shared/types';
import UserAvatar from './UserAvatar';

interface UserProfileProps {
  user: User;
  isCurrentUser?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, isCurrentUser = false }) => {
  // Przygotuj inicjały z imienia i nazwiska
  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  // Bezpieczne formatowanie daty - sprawdzamy czy createdAt istnieje
  const formattedJoinDate = user.createdAt ? formatDate(user.createdAt) : 'Brak daty';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start">
        <div className="flex flex-col items-center mb-4 sm:mb-0 sm:mr-6">
          <UserAvatar
            src={user.profileImage}
            initials={initials}
            size="xl"
            alt={user.fullName}
          />
          
          {isCurrentUser && (
            <Link
              to="/profile/edit"
              className="mt-3 inline-flex items-center px-4 py-2 border border-primary rounded-md shadow-sm text-sm font-medium text-primary hover:bg-primary-light/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Edytuj profil
            </Link>
          )}
        </div>
        
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
          
          <div className="mt-1 flex flex-col sm:flex-row sm:items-center text-sm text-gray-500">
            <span className="bg-primary-light/20 text-primary px-2 py-1 rounded-full capitalize">
              {user.role === 'farmer' ? 'Rolnik' : 'Konsument'}
            </span>
            <span className="mt-1 sm:mt-0 sm:ml-2">
              {user.createdAt ? `Dołączył ${formattedJoinDate}` : 'Brak daty dołączenia'}
            </span>
          </div>
          
          {user.bio && (
            <div className="mt-4">
              <h2 className="text-lg font-medium text-gray-900">O mnie</h2>
              <p className="mt-1 text-gray-700">{user.bio}</p>
            </div>
          )}
          
          <div className="mt-4">
            <h2 className="text-lg font-medium text-gray-900">Kontakt</h2>
            <div className="mt-1 grid grid-cols-1 gap-2">
              <div className="flex items-center text-gray-700">
                <svg
                  className="h-5 w-5 mr-2 text-gray-500"
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
                <span>{user.email}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <svg
                  className="h-5 w-5 mr-2 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>{user.phoneNumber}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <svg
                  className="h-5 w-5 mr-2 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{user.location?.address || 'Brak adresu'}</span>
              </div>
            </div>
          </div>
          
          {user.role === 'farmer' && user.certificates && user.certificates.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-medium text-gray-900">Certyfikaty</h2>
              <div className="mt-1 flex flex-wrap">
                {user.certificates.map((cert, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2 mb-2"
                  >
                    {typeof cert === 'string' ? cert : cert}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;