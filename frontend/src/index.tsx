import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { initializeTheme } from './utils/themeManager';
import { initApiClient } from './utils/initClient';

// Initialize generated API client
initApiClient();

// Initialize theme before rendering
initializeTheme();

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);