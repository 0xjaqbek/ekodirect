// src/App.tsx
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-text">
        <header className="bg-primary text-white p-4">
          <h1 className="text-2xl font-bold">EkoDirekt</h1>
        </header>
        <main className="container mx-auto p-4">
          <p>Platforma łącząca ekologicznych rolników z konsumentami</p>
        </main>
      </div>
    </Router>
  );
}

export default App;