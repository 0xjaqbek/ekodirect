// src/modules/auth/index.ts
// Components
export { default as LoginForm } from './components/LoginForm';
export { default as RegisterForm } from './components/RegisterForm';
export { default as ProtectedRoute } from './components/ProtectedRoute';
export { default as RoleBasedRoute } from './components/RoleBasedRoute';
export { default as UserMenu } from './components/UserMenu';

// Pages
export { default as LoginPage } from './pages/LoginPage';
export { default as RegisterPage } from './pages/RegisterPage';
export { default as VerifyEmailInfoPage } from './pages/VerifyEmailInfoPage';

// Hooks
export { default as useAuth } from './hooks/useAuth';

// Store
export { useAuthStore } from './store/authStore';
export type { AuthState } from './store/authStore';

// Services
export { default as authService } from './services/authService';

// Utils
export * from './utils/authValidation';