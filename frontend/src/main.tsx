// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext'; // Add this import
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <TooltipProvider>
        <ThemeProvider> {/* Wrap with ThemeProvider */}
          <App />
        </ThemeProvider>
      </TooltipProvider>
    </BrowserRouter>
  </React.StrictMode>
);