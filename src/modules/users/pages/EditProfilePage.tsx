// src/modules/users/pages/EditProfilePage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserProfileForm from '../components/UserProfileForm';

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edytuj profil</h1>
          <p className="text-gray-600">Dostosuj swoje dane profilowe i preferencje.</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Anuluj
        </button>
      </div>

      <UserProfileForm />
    </div>
  );
};

export default EditProfilePage;
