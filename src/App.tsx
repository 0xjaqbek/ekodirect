// src/App.tsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  LoginPage, 
  RegisterPage, 
  VerifyEmailInfoPage, 
  ProtectedRoute 
} from './modules/auth';
import { UserMenu } from './modules/auth';
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
              
              {/* Protected routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              
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

const ProfilePage = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4">Twój profil</h1>
    <p>Tu będą wyświetlane informacje o Twoim profilu</p>
  </div>
);

const NotFoundPage = () => (
  <div className="text-center py-10">
    <h1 className="text-4xl font-bold mb-4">404</h1>
    <p>Strona nie została znaleziona</p>
  </div>
);

export default App;