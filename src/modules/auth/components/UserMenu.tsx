// src/modules/auth/components/UserMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const UserMenu: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (isOpen) setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle menu toggling
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          to="/login"
          className="text-primary hover:text-primary-dark font-medium"
        >
          Zaloguj się
        </Link>
        <Link
          to="/register"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          Zarejestruj się
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="flex items-center space-x-2 focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="h-10 w-10 rounded-full bg-primary-light text-white flex items-center justify-center">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.fullName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <span className="font-medium text-lg">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <span className="hidden md:block font-medium">
          {user.fullName}
        </span>
        <svg
          className={`h-5 w-5 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Twój profil
            </Link>

            {user.role === 'farmer' && (
              <>
                <Link
                  to="/farmer/products"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Twoje produkty
                </Link>
                <Link
                  to="/farmer/orders"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Zamówienia
                </Link>
                <Link
                  to="/farmer/certificates"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Certyfikaty
                </Link>
              </>
            )}

            {user.role === 'consumer' && (
              <>
                <Link
                  to="/orders"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Twoje zamówienia
                </Link>
                <Link
                  to="/favorites"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Ulubione produkty
                </Link>
              </>
            )}

            {user.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Panel admina
              </Link>
            )}

            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Ustawienia
            </Link>

            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Wyloguj się
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;