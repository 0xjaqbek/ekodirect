// backend/server.ts (Fixed version with proper route handling)
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Initialize environment variables first
dotenv.config();

// Initialize Firebase before importing routes
import './firebase';

// Import routes (use default imports to avoid potential issues)
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import userRoutes from './routes/users';

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

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Main route for testing API
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'EkoDirect API is running with Firebase',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes - Mount with proper ordering
try {
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/users', userRoutes);
  console.log('Routes mounted successfully');
} catch (error) {
  console.error('Error mounting routes:', error);
  process.exit(1);
}

// 404 handler for undefined routes
app.use('*', (req: Request, res: Response) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Global error handler:', err);
  
  // Handle specific error types
  if (err.message && err.message.includes('Nieprawidłowy format pliku')) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  // Don't send error details in production
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(500).json({
    success: false,
    error: errorMessage
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Firebase Storage Bucket: ${process.env.FIREBASE_STORAGE_BUCKET || 'Not configured'}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});