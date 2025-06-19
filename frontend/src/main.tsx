// src/main.tsx (Vite default)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  
  <React.StrictMode>
    <BrowserRouter>
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </BrowserRouter>
  </React.StrictMode>
);
