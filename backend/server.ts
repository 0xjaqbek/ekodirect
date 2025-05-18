// backend/server.ts - Complete server setup with all routes
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Firebase initialization (this needs to be imported early)
import './firebase';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';

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

// API Routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  // Handle Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'Plik jest za duży. Maksymalny rozmiar to 5MB.'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: 'Za dużo plików. Maksymalna liczba plików to 5.'
    });
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