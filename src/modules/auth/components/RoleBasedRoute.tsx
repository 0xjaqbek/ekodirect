// src/modules/auth/components/RoleBasedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'farmer' | 'consumer' | 'admin'>;
  redirectTo?: string;
}

/**
 * Higher-Order Component to protect routes based on user roles
 * If user doesn't have the required role, redirects to specified route
 */
const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/unauthorized' 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // If user doesn't have required role, redirect to unauthorized page
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  // If user has the required role, render the protected content
  return <>{children}</>;
};

export default RoleBasedRoute;