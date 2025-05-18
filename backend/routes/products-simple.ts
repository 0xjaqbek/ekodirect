// backend/routes/products-simple.ts - Minimal version for testing
import express from 'express';

const router = express.Router();

// Basic routes without middleware
router.get('/', (req, res) => {
  res.json({ message: 'Products route working' });
});

router.get('/test', (req, res) => {
  res.json({ message: 'Products test route working' });
});

// Simple parameterized route
router.get('/:id', (req, res) => {
  res.json({ message: `Product ${req.params.id}` });
});

export default router;