// server/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Simple test endpoint
app.post('/api/test', (req, res) => {
  console.log('Test endpoint hit with data:', req.body);
  res.json({ success: true, message: 'Test endpoint working' });
});

// Root route for API testing
app.get('/', (req, res) => {
  res.json({ message: 'EkoDirect API is running with Firebase' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

app.get('/api/test-firebase', async (req, res) => {
  try {
    const testDoc = await db.collection('test').add({
      message: 'Test document',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      message: 'Firebase test successful',
      docId: testDoc.id
    });
  } catch (error) {
    console.error('Firebase test error:', error);
    res.status(500).json({
      success: false,
      error: 'Firebase test failed: ' + error.message
    });
  }
});