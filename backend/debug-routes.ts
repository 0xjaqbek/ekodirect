// backend/debug-routes.ts - Use this to test route imports individually
import express from 'express';

async function testRouteImports() {
  console.log('Testing route imports...');
  
  try {
    console.log('Testing auth routes...');
    const authRoutes = await import('./routes/auth.js');
    console.log('Auth routes OK');
    
    console.log('Testing user routes...');
    const userRoutes = await import('./routes/users.js');
    console.log('User routes OK');
    
    console.log('Testing product routes...');
    const productRoutes = await import('./routes/products.js');
    console.log('Product routes OK');
    
    // Test creating an Express app with the routes
    const app = express();
    app.use('/api/auth', authRoutes.default);
    app.use('/api/users', userRoutes.default);
    app.use('/api/products', productRoutes.default);
    
    console.log('All routes imported and configured successfully');
  } catch (error) {
    console.error('Error importing routes:', error);
    console.error('Stack trace:', error);
  }
}

testRouteImports();