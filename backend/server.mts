// backend/server.mts - Debug version
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Firebase initialization (this needs to be imported early)
import './firebase.js';

// Initialize environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'EkoDirect API is running with Firebase',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Test route to verify basic functionality
app.get('/test', (req, res) => {
  res.json({ message: 'Test route works' });
});

// Try importing routes one by one to identify the problematic one
try {
  console.log('Importing auth routes...');
  const authRoutes = await import('./routes/auth.js');
  app.use('/api/auth', authRoutes.default);
  console.log('Auth routes loaded successfully');
} catch (error) {
  console.error('Error loading auth routes:', error);
}

try {
  console.log('Importing user routes...');
  const userRoutes = await import('./routes/users.js');
  app.use('/api/users', userRoutes.default);
  console.log('User routes loaded successfully');
} catch (error) {
  console.error('Error loading user routes:', error);
}

try {
  console.log('Importing product routes...');
  const productRoutes = await import('./routes/products.js');
  app.use('/api/products', productRoutes.default);
  console.log('Product routes loaded successfully');
} catch (error) {
  console.error('Error loading product routes:', error);
}

// Custom error interface
interface CustomError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

// Global error handling middleware
app.use((err: CustomError, req: express.Request, res: express.Response, next: express.NextFunction): void => {
  console.error('Global error handler:', err);
  
  // Handle Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({
      success: false,
      error: 'Plik jest za duży. Maksymalny rozmiar to 5MB.'
    });
    return;
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    res.status(400).json({
      success: false,
      error: 'Za dużo plików. Maksymalna liczba plików to 5.'
    });
    return;
  }
  
  // Handle other errors
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Wystąpił błąd serwera';
  
  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle 404 for undefined routes
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'GET /test',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/refresh-token',
      'POST /api/auth/verify-email',
      'GET /api/users/me',
      'GET /api/products'
    ]
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🌟 Health check: http://localhost:${PORT}/`);
  console.log(`🔥 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});