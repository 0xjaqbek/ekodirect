// server/server.js (zmodyfikowany)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Inicjalizacja zmiennych środowiskowych
dotenv.config();

// Pobierz ścieżkę bieżącego pliku
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicjalizacja aplikacji Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Statyczne pliki (dla avatarów)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Podstawowe trasy API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Prosty endpoint testowy
app.post('/api/test', (req, res) => {
  console.log('Test endpoint hit with data:', req.body);
  res.json({ success: true, message: 'Test endpoint working' });
});

// Główna trasa dla testowania API
app.get('/', (req, res) => {
  res.json({ message: 'EkoDirect API is running with Firebase' });
});

// Middleware obsługi błędów
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Uruchomienie serwera
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});