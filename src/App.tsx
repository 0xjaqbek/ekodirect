// src/App.tsx (zmodyfikowany)

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  LoginPage, 
  RegisterPage, 
  VerifyEmailInfoPage, 
  ProtectedRoute 
} from './modules/auth';
import { UserMenu } from './modules/auth';
// Importy z modułu użytkowników
import {
  ProfilePage,
  EditProfilePage,
  FarmerProfilePage
} from './modules/users';
import './App.css';

// Create Query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background text-text">
          <header className="bg-primary text-white p-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">EkoDirekt</h1>
            <UserMenu />
          </header>
          
          <main className="container mx-auto p-4">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyEmailInfoPage />} />
              <Route path="/verify-email-info" element={<VerifyEmailInfoPage />} />
              
              {/* Trasy związane z użytkownikami - dostępne tylko dla zalogowanych */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/profile/edit" element={
                <ProtectedRoute>
                  <EditProfilePage />
                </ProtectedRoute>
              } />
              {/* Publiczny profil rolnika - dostępny dla wszystkich */}
              <Route path="/farmers/:id" element={<FarmerProfilePage />} />
              
              {/* Fallback route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

// Placeholder components for demonstration
const HomePage = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">Witaj w EkoDirekt!</h1>
    <p>Platforma łącząca ekologicznych rolników z konsumentami</p>
  </div>
);

const NotFoundPage = () => (
  <div className="text-center py-10">
    <h1 className="text-4xl font-bold mb-4">404</h1>
    <p>Strona nie została znaleziona</p>
  </div>
);

export default App;